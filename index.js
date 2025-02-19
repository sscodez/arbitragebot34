const express = require("express");
const ethers = require("ethers");
const axios = require("axios");
const BigNumber = require('bignumber.js');
const app = express();
require("dotenv").config();

// BSC MainNet provider with WebSocket for real-time updates
const HTTP_PROVIDER = "https://bsc-dataseed.binance.org/";
const WS_PROVIDER = "wss://bsc-ws-node.nariox.org:443";
const provider = new ethers.providers.JsonRpcProvider(HTTP_PROVIDER);
const wsProvider = new ethers.providers.WebSocketProvider(WS_PROVIDER);

// DEX Router Addresses
const PANCAKE_ROUTER = process.env.PANCAKE_ROUTER;
const APE_ROUTER = process.env.APE_ROUTER;
const BISWAP_ROUTER = process.env.BISWAP_ROUTER;
const MDEX_ROUTER = process.env.MDEX_ROUTER;

// Flash Loan Provider
const PANCAKE_FLASH_LOAN_ADDRESS =  process.env.PANCAKE_FLASH_LOAN_ADDRESS;

// Token Addresses
const GUDS_ADDRESS = require("./constant/constant").GudsContractAddress;
const USDT_ADDRESS = require("./constant/constant").UsdtContractAddress;
const WBNB_ADDRESS =  require("./constant/constant").WbnbContractAddress;
const BUSD_ADDRESS = require("./constant/constant").BnbContractAddress;

// Configuration
const CONFIG = {
    PROFIT_THRESHOLD: ethers.utils.parseUnits("10", 18),
    MAX_PRICE_IMPACT: 0.02, 
    SLIPPAGE_TOLERANCE: 0.005,
    GAS_PRICE_BUFFER: 1.5,
    FLASH_LOAN_FEE: 0.0009, 
    CHECK_INTERVAL: 15000, 
    HEALTH_CHECK_INTERVAL: 300000, 
    MAX_RETRIES: 3,
    CONCURRENT_PATHS: 3,
};

// ABIs
const ROUTER_ABI = require("./constant/constant").ContractABI;
const FLASH_LOAN_ABI = require("./constant/constant").FlashLoanABI;

// Initialize contracts
const dexRouters = {
    pancakeswap: new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, provider),
    apeswap: new ethers.Contract(APE_ROUTER, ROUTER_ABI, provider),
    biswap: new ethers.Contract(BISWAP_ROUTER, ROUTER_ABI, provider),
    mdex: new ethers.Contract(MDEX_ROUTER, ROUTER_ABI, provider)
};

// Initialize wallet
const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);
const wsWallet = new ethers.Wallet(privateKey, wsProvider);

// Connect routers to wallet
const connectedRouters = Object.entries(dexRouters).reduce((acc, [key, router]) => {
    acc[key] = router.connect(wallet);
    return acc;
}, {});

// Trading paths configuration
const TRADING_PATHS = [
    [GUDS_ADDRESS, USDT_ADDRESS],
    [GUDS_ADDRESS, WBNB_ADDRESS, USDT_ADDRESS],
    [GUDS_ADDRESS, BUSD_ADDRESS, USDT_ADDRESS],
];

// State management
let isExecutingTrade = false;
let healthCheckPassed = true;
let lastProfitableBlock = 0;
let consecutiveFailures = 0;

// Price monitoring with WebSocket
function setupPriceMonitoring() {
    const topics = [
        ethers.utils.id("Swap(address,uint256,uint256,uint256,uint256,address)"),
    ];

    wsProvider.on(topics, async (log) => {
        if (isExecutingTrade || !healthCheckPassed) return;
        await checkArbitrageOpportunities();
    });
}

// Advanced price calculation with price impact
async function calculatePriceWithImpact(router, path, amountIn) {
    try {
        const amounts = await router.getAmountsOut(amountIn, path);
        const outputAmount = amounts[amounts.length - 1];
        
        // Calculate price impact
        const smallAmount = amountIn.div(1000);
        const smallAmounts = await router.getAmountsOut(smallAmount, path);
        const expectedRate = outputAmount.mul(1000).div(amountIn);
        const actualRate = smallAmounts[smallAmounts.length - 1].mul(1000).div(smallAmount);
        
        const priceImpact = expectedRate.sub(actualRate).mul(100).div(expectedRate);
        
        return {
            outputAmount,
            priceImpact: priceImpact.toNumber() / 100
        };
    } catch (error) {
        console.error(`Error calculating price with impact: ${error.message}`);
        return null;
    }
}

// MEV protection
function calculateOptimalGasPrice() {
    return provider.getGasPrice().then(baseGasPrice => {
        const maxPriorityFeePerGas = ethers.utils.parseUnits("2", "gwei");
        return {
            maxFeePerGas: baseGasPrice.mul(Math.ceil(CONFIG.GAS_PRICE_BUFFER * 100)).div(100),
            maxPriorityFeePerGas
        };
    });
}

// Flash loan execution
async function executeFlashLoanArbitrage(buyRouter, sellRouter, path, amount) {
    const flashLoanContract = new ethers.Contract(PANCAKE_FLASH_LOAN_ADDRESS, FLASH_LOAN_ABI, wallet);
    
    const params = ethers.utils.defaultAbiCoder.encode(
        ['address', 'address', 'address[]'],
        [buyRouter.address, sellRouter.address, path]
    );
    
    try {
        const tx = await flashLoanContract.flashLoan(
            wallet.address,
            path[0],
            amount,
            params,
            await calculateOptimalGasPrice()
        );
        
        return await tx.wait();
    } catch (error) {
        console.error(`Flash loan execution failed: ${error.message}`);
        return null;
    }
}

// Multi-path arbitrage finder
async function findBestArbitragePath() {
    const opportunities = [];
    
    for (const path of TRADING_PATHS) {
        const baseAmount = ethers.utils.parseUnits("1000", 18);
        
        const prices = await Promise.all(
            Object.entries(connectedRouters).map(async ([dex, router]) => {
                const priceData = await calculatePriceWithImpact(router, path, baseAmount);
                return { dex, ...priceData };
            })
        );
        
        // Find best buy and sell prices
        const validPrices = prices.filter(p => p && p.priceImpact < CONFIG.MAX_PRICE_IMPACT);
        if (validPrices.length < 2) continue;
        
        const bestBuy = validPrices.reduce((a, b) => 
            b.outputAmount.gt(a.outputAmount) ? b : a
        );
        
        const bestSell = validPrices.reduce((a, b) => 
            b.outputAmount.lt(a.outputAmount) ? b : a
        );
        
        if (bestBuy.dex !== bestSell.dex) {
            const profit = bestSell.outputAmount.sub(bestBuy.outputAmount);
            if (profit.gt(CONFIG.PROFIT_THRESHOLD)) {
                opportunities.push({
                    buyDex: bestBuy.dex,
                    sellDex: bestSell.dex,
                    path,
                    profit,
                    priceImpact: Math.max(bestBuy.priceImpact, bestSell.priceImpact)
                });
            }
        }
    }
    
    return opportunities.sort((a, b) => b.profit.sub(a.profit));
}

// Health check function
async function performHealthCheck() {
    try {
        // Check node connection
        await provider.getNetwork();
        
        // Check wallet balance
        const balance = await wallet.getBalance();
        if (balance.lt(ethers.utils.parseEther("0.1"))) {
            throw new Error("Insufficient BNB balance for gas");
        }
        
        // Check contract approvals
        const tokenContract = new ethers.Contract(GUDS_ADDRESS, [
            "function allowance(address,address) view returns (uint256)"
        ], wallet);
        
        for (const router of Object.values(connectedRouters)) {
            const allowance = await tokenContract.allowance(wallet.address, router.address);
            if (allowance.lt(ethers.utils.parseUnits("1000000", 18))) {
                throw new Error(`Insufficient allowance for ${router.address}`);
            }
        }
        
        healthCheckPassed = true;
        consecutiveFailures = 0;
        console.log("Health check passed successfully");
    } catch (error) {
        healthCheckPassed = false;
        console.error(`Health check failed: ${error.message}`);
        
        // Send notification (implement your notification system)
        await sendNotification(`Bot health check failed: ${error.message}`);
    }
}

// Main arbitrage execution function
async function executeArbitrage(opportunity) {
    if (isExecutingTrade || !healthCheckPassed) return;
    
    isExecutingTrade = true;
    try {
        const buyRouter = connectedRouters[opportunity.buyDex];
        const sellRouter = connectedRouters[opportunity.sellDex];
        
        // Calculate optimal amount
        const optimalAmount = await calculateOptimalTradeAmount(
            buyRouter,
            sellRouter,
            opportunity.path
        );
        
        // Execute flash loan if profitable
        const flashLoanFee = optimalAmount.mul(CONFIG.FLASH_LOAN_FEE * 10000).div(10000);
        const potentialProfit = opportunity.profit.sub(flashLoanFee);
        
        if (potentialProfit.gt(CONFIG.PROFIT_THRESHOLD)) {
            const result = await executeFlashLoanArbitrage(
                buyRouter,
                sellRouter,
                opportunity.path,
                optimalAmount
            );
            
            if (result) {
                console.log(`Successful arbitrage: ${ethers.utils.formatUnits(potentialProfit, 18)} USDT profit`);
                lastProfitableBlock = await provider.getBlockNumber();
            }
        }
    } catch (error) {
        console.error(`Arbitrage execution failed: ${error.message}`);
        consecutiveFailures++;
        
        if (consecutiveFailures >= CONFIG.MAX_RETRIES) {
            healthCheckPassed = false;
            await sendNotification("Too many consecutive failures, triggering health check");
        }
    } finally {
        isExecutingTrade = false;
    }
}

// Main monitoring function
async function checkArbitrageOpportunities() {
    if (!healthCheckPassed) return;
    
    try {
        const opportunities = await findBestArbitragePath();
        
        // Execute top opportunities concurrently
        const executableOpportunities = opportunities.slice(0, CONFIG.CONCURRENT_PATHS);
        await Promise.all(executableOpportunities.map(executeArbitrage));
        
    } catch (error) {
        console.error(`Error in main loop: ${error.message}`);
    }
}

// Notification system (implement your preferred notification method)
async function sendNotification(message) {
    // Implement your notification logic (e.g., Discord, Telegram, Email)
    console.log(`NOTIFICATION: ${message}`);
}

// Add WebSocket server
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store console logs
let consoleOutput = [];
const MAX_LOGS = 1000;

// Override console.log
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'info',
        message
    };
    
    consoleOutput.push(logEntry);
    if (consoleOutput.length > MAX_LOGS) {
        consoleOutput.shift();
    }
    
    // Broadcast to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(logEntry));
        }
    });
    
    originalLog.apply(console, args);
};

console.error = function (...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
    ).join(' ');
    
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'error',
        message
    };
    
    consoleOutput.push(logEntry);
    if (consoleOutput.length > MAX_LOGS) {
        consoleOutput.shift();
    }
    
    // Broadcast to all connected clients
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(logEntry));
        }
    });
    
    originalError.apply(console, args);
};

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Route for console page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to get all logs
app.get('/api/logs', (req, res) => {
    res.json(consoleOutput);
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New client connected');
    
    // Send existing logs to new client
    ws.send(JSON.stringify({ type: 'init', logs: consoleOutput }));
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Initialize bot
async function initializeBot() {
    try {
        await performHealthCheck();
        if (healthCheckPassed && privateKey) {
            setupPriceMonitoring();
            setInterval(checkArbitrageOpportunities, CONFIG.CHECK_INTERVAL);
            setInterval(performHealthCheck, CONFIG.HEALTH_CHECK_INTERVAL);
            
            console.log("Arbitrage bot initialized successfully");
            console.log(`Monitoring ${Object.keys(connectedRouters).length} DEXes`);
            console.log(`Configured with ${TRADING_PATHS.length} trading paths`);
        }
    } catch (error) {
        console.error(`Bot initialization failed: ${error.message}`);
        process.exit(1);
    }
}

// Start server
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Advanced arbitrage bot running on port ${port}`);
    initializeBot();
});
