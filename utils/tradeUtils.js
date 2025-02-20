import { ethers } from 'ethers';
import { chainManager } from './chainUtils.js';
import { routerABI } from '../constant/routerABI.js';
import { CHAIN_SETTINGS, SUPPORTED_CHAINS } from '../constant/chains.js';
import { getTokenPrice, getPairData } from './tokenUtils.js';

const ERC20_ABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
];

async function logError(error) {
    if (typeof error === 'string') {
        console.error('Trade Error:', error);
        return;
    }
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorReason = error.error?.reason?.toLowerCase() || '';
    
    if (errorMessage.includes('insufficient funds') || errorReason.includes('insufficient funds')) {
        console.error('Trade Error: Insufficient balance for transaction');
    } else if (errorMessage.includes('transfer_from_failed')) {
        console.error('Trade Error: Token transfer failed - check balance and approval');
    } else if (errorMessage.includes('gas required exceeds')) {
        console.error('Trade Error: Gas estimation failed - try reducing trade size');
    } else {
        console.error('Trade Error:', error);
    }
}

async function checkAndApproveToken(tokenAddress, spenderAddress, wallet, amount) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const allowance = await tokenContract.allowance(wallet.address, spenderAddress);

        if (allowance.lt(amount)) {
            const tx = await tokenContract.approve(spenderAddress, amount);
            await tx.wait();
            return true;
        }
        return true;
    } catch (error) {
        console.error('Error in checkAndApproveToken:', error);
        return false;
    }
}

async function getTokenBalance(tokenAddress, wallet) {
    try {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const balance = await tokenContract.balanceOf(wallet.address);
        return balance;
    } catch (error) {
        console.error('Error in getTokenBalance:', error);
        return ethers.BigNumber.from(0);
    }
}

async function getAllTokenBalances(wallet) {
    const balances = {};
    const { tokens } = SUPPORTED_CHAINS.BSC;

    for (const [symbol, token] of Object.entries(tokens)) {
        const balance = await getTokenBalance(token.address, wallet);
        balances[symbol] = balance;
    }

    return balances;
}

async function calculateOptimalTradeSize(chainId, dex, baseToken, quoteToken, maxTradeSize) {
    const config = chainManager.getArbitrageConfig(chainId);
    if (!config) return { bestTradeSize: 0, bestProfit: 0 };

    try {
        const provider = chainManager.getProvider(chainId);
        const routerContract = new ethers.Contract(dex.router, routerABI, provider);
        
        // Test different trade sizes
        const tradeSizes = [
            maxTradeSize * 0.25,
            maxTradeSize * 0.5,
            maxTradeSize * 0.75,
            maxTradeSize
        ];

        let bestTradeSize = 0;
        let bestProfit = 0;

        for (const size of tradeSizes) {
            const amountIn = ethers.utils.parseEther(size.toString());
            const amounts = await routerContract.getAmountsOut(amountIn, [baseToken, quoteToken]);
            const expectedOutput = ethers.utils.formatEther(amounts[1]);
            
            // Calculate profit after fees and gas
            const gasPrice = await chainManager.getGasPrice(chainId);
            const gasLimit = await chainManager.getOptimalGasLimit(chainId, 210000);
            const gasCost = gasPrice.mul(gasLimit);
            
            const profit = parseFloat(expectedOutput) - (parseFloat(size) + parseFloat(ethers.utils.formatEther(gasCost)));
            
            if (profit > bestProfit) {
                bestProfit = profit;
                bestTradeSize = size;
            }
        }

        return { bestTradeSize, bestProfit };
    } catch (error) {
        logError(error);
        return { bestTradeSize: 0, bestProfit: 0 };
    }
}

async function executeTrade(
    chainId,
    wallet,
    dex,
    baseToken,
    quoteToken,
    amount,
    minReturn
) {
    try {
        const amountIn = ethers.utils.parseEther(amount.toString());
        const deadline = Math.floor(Date.now() / 1000) + 300;
        
        // First approve the router to spend tokens
        const approved = await checkAndApproveToken(baseToken, dex.router, wallet, amountIn);
        if (!approved) {
            console.error('Trade Error: Token approval failed');
            return null;
        }
        
        const routerContract = new ethers.Contract(dex.router, routerABI, wallet);
        const path = [baseToken, quoteToken];
        const gasPrice = await chainManager.getGasPrice(chainId);

        const tx = await routerContract.swapExactTokensForTokens(
            amountIn,
            minReturn,
            path,
            wallet.address,
            deadline,
            {
                gasLimit: await chainManager.getOptimalGasLimit(chainId, 210000),
                gasPrice
            }
        );

        const success = await chainManager.waitForConfirmations(chainId, tx.hash);
        return success ? tx : null;
    } catch (error) {
        logError(error);
        return null;
    }
}

async function checkArbitrageOpportunity(
    chainId,
    dexA,
    dexB,
    baseToken,
    quoteToken,
    amount,
    minProfitPercent
) {
    try {
        const provider = chainManager.getProvider(chainId);
        const config = chainManager.getArbitrageConfig(chainId);
        
        if (!config) {
            console.error('Trade Error: Chain configuration not found');
            return null;
        }

        const routerA = new ethers.Contract(dexA.router, routerABI, provider);
        const routerB = new ethers.Contract(dexB.router, routerABI, provider);

        const amountIn = ethers.utils.parseEther(amount);
        
        // Get prices from both DEXes
        const [amountsA, amountsB] = await Promise.all([
            routerA.getAmountsOut(amountIn, [baseToken, quoteToken]),
            routerB.getAmountsOut(amountIn, [baseToken, quoteToken])
        ]);

        const priceA = parseFloat(ethers.utils.formatEther(amountsA[1]));
        const priceB = parseFloat(ethers.utils.formatEther(amountsB[1]));

        // Calculate profit percentage
        const priceDiff = Math.abs(priceA - priceB);
        const profitPercent = (priceDiff / Math.min(priceA, priceB)) * 100;

        if (profitPercent >= minProfitPercent) {
            // Determine which DEX to buy from and sell to
            const [buyDex, sellDex] = priceA < priceB ? [routerA, routerB] : [routerB, routerA];
            const profit = priceDiff - (priceDiff * 0.003); // Account for fees

            return {
                profit,
                profitPercent,
                buyDex: priceA < priceB ? dexA : dexB,
                sellDex: priceA < priceB ? dexB : dexA,
                routerContract: buyDex,
                tradeSize: amount,
                minReturn: ethers.utils.parseEther((Math.min(priceA, priceB) * 0.995).toString()) // 0.5% slippage
            };
        }

        return null;
    } catch (error) {
        logError(error);
        return null;
    }
}

async function findArbitrageOpportunities(prices) {
    const opportunities = [];
    const { dexes, tokens } = SUPPORTED_CHAINS.BSC;
    const settings = CHAIN_SETTINGS.BSC;

    // Compare prices across different DEXes
    for (const [dexAName, dexAData] of Object.entries(prices)) {
        for (const [dexBName, dexBData] of Object.entries(prices)) {
            if (dexAName === dexBName) continue;

            for (const pairA of dexAData.pairs) {
                const pairB = dexBData.pairs.find(p => 
                    p.token0.address === pairA.token0.address && 
                    p.token1.address === pairA.token1.address
                );

                if (!pairB) continue;

                // Calculate potential profit
                const priceA = parseFloat(pairA.price);
                const priceB = parseFloat(pairB.price);
                const priceDiff = Math.abs(priceA - priceB);
                const avgPrice = (priceA + priceB) / 2;
                const profitPercent = (priceDiff / avgPrice) * 100;

                if (profitPercent > settings.slippage) {
                    opportunities.push({
                        dexA: dexAName,
                        dexB: dexBName,
                        token0: pairA.token0.symbol,
                        token1: pairA.token1.symbol,
                        priceA,
                        priceB,
                        profit: priceDiff,
                        profitPercent
                    });
                }
            }
        }
    }

    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
}

export { 
    calculateOptimalTradeSize, 
    executeTrade, 
    checkArbitrageOpportunity, 
    findArbitrageOpportunities, 
    checkAndApproveToken, 
    getTokenBalance, 
    getAllTokenBalances 
};
