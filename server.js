import express from 'express';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;
const httpServer = createServer(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});

// Store active bots
const activeBots = new Map();

// Default bot settings
const DEFAULT_BOT_CONFIG = {
  minProfitThreshold: 0.1, // 0.1% minimum profit
  maxTradeAmount: 1000,    // 1000 USDT max trade
  startTime: null,
  updateInterval: null,
  stats: null
};

// Function to check token balance
const checkBalance = async (address, token) => {
  try {
    // Simulated balance check - updated with stablecoin balances
    const balances = {
      'USDT': ethers.utils.parseUnits('0', 6),  // Start with 0 USDT
      'DAI': ethers.utils.parseUnits('0', 18),  // Start with 0 DAI
    };

    // Get actual balance if we have provider
    if (address && token) {
      try {
        // Log the balance check attempt
        console.log(`Checking balance for ${token} at address ${address}`);
        return balances[token] || ethers.constants.Zero;
      } catch (error) {
        console.error('Error getting actual balance:', error);
        return balances[token] || ethers.constants.Zero;
      }
    }

    return balances[token] || ethers.constants.Zero;
  } catch (error) {
    console.error('Error checking balance:', error);
    return ethers.constants.Zero;
  }
};

// Function to execute trade
const executeTrade = async (botConfig, opportunity) => {
  const { address } = botConfig;
  const { pair, buyDex, sellDex, buyPrice, sellPrice, profit, amount } = opportunity;
  
  try {
    const [baseToken, quoteToken] = pair.split('/');
    
    // Check base token balance
    const balance = await checkBalance(address, baseToken);
    const decimals = baseToken === 'USDT' ? 6 : 18; // USDT uses 6 decimals, DAI uses 18
    const requiredAmount = ethers.utils.parseUnits(amount.toString(), decimals);
    
    console.log(`Balance check for ${baseToken}:`, {
      available: ethers.utils.formatUnits(balance, decimals),
      required: amount,
      hasEnough: balance.gte(requiredAmount)
    });

    if (balance.lt(requiredAmount)) {
      const errorMessage = `Insufficient ${baseToken} balance. Required: ${amount} ${baseToken}, Available: ${ethers.utils.formatUnits(balance, decimals)} ${baseToken}`;
      console.log('Trade cancelled:', errorMessage);
      
      broadcast({
        type: 'error',
        data: {
          message: errorMessage,
          address,
          token: baseToken
        }
      });
      return false;
    }

    // Simulate trade execution
    const txHash = '0x' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    
    // Broadcast trade start
    broadcast({
      type: 'transactionUpdate',
      data: {
        address,
        status: 'pending',
        hash: txHash,
        pair,
        profit,
        buyDex,
        sellDex,
        buyPrice,
        sellPrice,
        amount: amount.toString()
      }
    });

    // Log trade attempt
    console.log('Attempting trade:', {
      pair,
      amount: `${amount} ${baseToken}`,
      buyAt: `${buyDex} (${buyPrice})`,
      sellAt: `${sellDex} (${sellPrice})`,
      expectedProfit: `${profit}%`
    });

    // Simulate transaction delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate success (90% chance)
    const success = Math.random() < 0.9;

    if (success) {
      // Update bot stats
      const stats = botConfig.stats || {
        totalProfit: '0.00',
        dailyVolume: '0.00',
        successRate: 0,
        totalTrades: 0,
        successfulTrades: 0
      };

      stats.totalTrades = (stats.totalTrades || 0) + 1;
      stats.successfulTrades = (stats.successfulTrades || 0) + 1;
      stats.totalProfit = (parseFloat(stats.totalProfit) + parseFloat(profit)).toFixed(2);
      stats.dailyVolume = (parseFloat(stats.dailyVolume) + parseFloat(amount)).toFixed(2);
      stats.successRate = Math.floor((stats.successfulTrades / stats.totalTrades) * 100);

      botConfig.stats = stats;

      console.log('Trade successful:', {
        profit: `${profit}%`,
        newStats: stats
      });

      broadcast({
        type: 'transactionUpdate',
        data: {
          address,
          status: 'success',
          hash: txHash,
          pair,
          profit,
          buyDex,
          sellDex,
          buyPrice,
          sellPrice,
          amount: amount.toString(),
          stats
        }
      });

      return true;
    } else {
      console.log('Trade failed: Price movement');
      
      broadcast({
        type: 'transactionUpdate',
        data: {
          address,
          status: 'failed',
          hash: txHash,
          pair,
          error: 'Transaction failed due to price movement'
        }
      });

      return false;
    }
  } catch (error) {
    console.error('Error executing trade:', error);
    broadcast({
      type: 'error',
      data: {
        message: `Trade execution failed: ${error.message}`,
        address
      }
    });
    return false;
  }
};

// Function to simulate bot activity for a specific address
const simulateBotActivity = (address) => {
  const botConfig = activeBots.get(address);
  if (!botConfig) return;

  // Initialize bot stats
  botConfig.stats = {
    totalProfit: '0.00',
    dailyVolume: '0.00',
    successRate: 0,
    totalTrades: 0,
    successfulTrades: 0
  };

  // Simulate price updates
  const interval = setInterval(async () => {
    if (!activeBots.has(address)) {
      clearInterval(interval);
      return;
    }

    // Simulate price changes for USDT/DAI
    const basePrice = 1.00;
    const priceUpdate = {
      type: 'priceUpdate',
      data: {
        'USDT/DAI': {
          dexA: (basePrice + (Math.random() - 0.5) * 0.002).toFixed(4),
          dexB: (basePrice + (Math.random() - 0.5) * 0.002).toFixed(4),
        }
      }
    };

    broadcast(priceUpdate);

    // Simulate finding arbitrage opportunities
    if (Math.random() < 0.3) {
      const dexPrices = priceUpdate.data['USDT/DAI'];
      const dexAPrice = parseFloat(dexPrices.dexA);
      const dexBPrice = parseFloat(dexPrices.dexB);
      
      // Determine which DEX to buy from and sell to
      const buyDex = dexAPrice < dexBPrice ? 'Uniswap' : 'Curve';
      const sellDex = dexAPrice < dexBPrice ? 'Curve' : 'Uniswap';
      const buyPrice = Math.min(dexAPrice, dexBPrice);
      const sellPrice = Math.max(dexAPrice, dexBPrice);
      
      const priceDiff = sellPrice - buyPrice;
      const profitPercent = (priceDiff / buyPrice * 100);
      
      // Check if profit meets minimum threshold
      if (profitPercent < botConfig.minProfitThreshold) {
        console.log(`Skipping opportunity - Profit ${profitPercent.toFixed(2)}% below threshold ${botConfig.minProfitThreshold}%`);
        return;
      }
      
      // Calculate trade amount (respect max trade amount)
      const amount = Math.min(1000, botConfig.maxTradeAmount);
      const expectedProfit = ((amount * sellPrice) - (amount * buyPrice)).toFixed(2);
      
      const opportunity = {
        pair: 'USDT/DAI',
        buyDex,
        sellDex,
        buyPrice: buyPrice.toFixed(4),
        sellPrice: sellPrice.toFixed(4),
        profit: profitPercent.toFixed(2),
        amount,
        expectedProfitUSD: expectedProfit,
        route: `Buy ${amount} USDT at ${buyPrice.toFixed(4)} on ${buyDex} → Sell at ${sellPrice.toFixed(4)} on ${sellDex}`
      };

      console.log('Found arbitrage opportunity:', {
        route: opportunity.route,
        profit: `${opportunity.profit}%`,
        expectedProfit: `$${expectedProfit}`,
        settings: {
          minProfit: `${botConfig.minProfitThreshold}%`,
          maxAmount: botConfig.maxTradeAmount
        }
      });

      broadcast({
        type: 'arbitrageOpportunity',
        data: {
          ...opportunity,
          timestamp: Date.now()
        }
      });

      // Try to execute the trade
      await executeTrade(botConfig, opportunity);
    }

    // Update bot status
    broadcast({
      type: 'botStatus',
      data: {
        address,
        status: 'running',
        uptime: Math.floor((Date.now() - botConfig.startTime) / 1000),
        stats: botConfig.stats,
        config: {
          minProfitThreshold: botConfig.minProfitThreshold,
          maxTradeAmount: botConfig.maxTradeAmount
        }
      }
    });
  }, 5000);

  botConfig.updateInterval = interval;
};

// WebSocket message handlers
const handleBotConfig = (ws, address, config) => {
  const botConfig = activeBots.get(address) || { ...DEFAULT_BOT_CONFIG };
  
  // Update bot configuration
  if (config.minProfitThreshold !== undefined) {
    botConfig.minProfitThreshold = parseFloat(config.minProfitThreshold);
  }
  if (config.maxTradeAmount !== undefined) {
    botConfig.maxTradeAmount = parseFloat(config.maxTradeAmount);
  }
  
  activeBots.set(address, botConfig);
  
  // Send confirmation
  ws.send(JSON.stringify({
    type: 'botConfig',
    data: {
      address,
      ...botConfig
    }
  }));
};

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Bot Management Endpoints
app.post('/bot/start', async (req, res) => {
  try {
    console.log('Received start bot request');
    const { privateKey, slippage = 0.5, gasLimit = 300000 } = req.body;
    
    if (!privateKey) {
      console.log('No private key provided');
      return res.status(400).json({ error: 'Private key is required' });
    }

    // Remove '0x' prefix if present
    const cleanPrivateKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

    try {
      // Validate private key format (64 characters hex string)
      if (!/^[0-9a-fA-F]{64}$/.test(cleanPrivateKey)) {
        console.log('Invalid private key format');
        return res.status(400).json({ error: 'Invalid private key format' });
      }

      // Create wallet with 0x prefix
      const wallet = new ethers.Wallet('0x' + cleanPrivateKey);
      const address = ethers.utils.getAddress(wallet.address); // Get checksum address
      console.log('Wallet address:', address);

      if (activeBots.has(address)) {
        console.log('Bot already running for address:', address);
        return res.status(400).json({ error: 'Bot is already running for this address' });
      }

      // Store bot configuration
      activeBots.set(address, {
        address,
        status: 'running',
        startTime: Date.now(),
        config: {
          slippage,
          gasLimit
        },
        ...DEFAULT_BOT_CONFIG
      });

      // Start bot simulation
      simulateBotActivity(address);

      console.log('Bot started for address:', address);
      console.log('Active bots:', Array.from(activeBots.keys()));

      // Broadcast bot start
      broadcast({
        type: 'botStatus',
        data: {
          address,
          status: 'running',
          uptime: 0
        }
      });

      res.json({ 
        success: true, 
        message: 'Bot started successfully',
        address: address,
        config: {
          slippage,
          gasLimit
        }
      });
    } catch (error) {
      console.error('Invalid private key:', error);
      return res.status(400).json({ error: 'Invalid private key' });
    }
  } catch (error) {
    console.error('Error starting bot:', error);
    res.status(500).json({ error: 'Failed to start bot' });
  }
});

app.post('/bot/stop', async (req, res) => {
  try {
    const { address } = req.body;
    console.log('Received stop bot request for address:', address);
    console.log('Active bots:', Array.from(activeBots.keys()));
    
    if (!address) {
      console.log('No address provided');
      return res.status(400).json({ error: 'Address is required' });
    }

    // Normalize the address to checksum format
    let checksumAddress;
    try {
      checksumAddress = ethers.utils.getAddress(address);
      console.log('Checksum address:', checksumAddress);
    } catch (error) {
      console.log('Invalid Ethereum address format');
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    if (!activeBots.has(checksumAddress)) {
      console.log('No active bot found for address:', checksumAddress);
      return res.status(400).json({ error: 'No active bot found for this address' });
    }

    const botConfig = activeBots.get(checksumAddress);

    // Clear update interval if it exists
    if (botConfig.updateInterval) {
      clearInterval(botConfig.updateInterval);
    }

    const runTime = Date.now() - botConfig.startTime;

    // Clean up
    activeBots.delete(checksumAddress);
    console.log('Bot stopped successfully for address:', checksumAddress);

    // Broadcast bot stop
    broadcast({
      type: 'botStatus',
      data: {
        address: checksumAddress,
        status: 'stopped',
        uptime: Math.floor(runTime / 1000)
      }
    });

    res.json({ 
      success: true, 
      message: 'Bot stopped successfully',
      stats: {
        address: checksumAddress,
        runTime: Math.floor(runTime / 1000) // Convert to seconds
      }
    });
  } catch (error) {
    console.error('Error stopping bot:', error);
    res.status(500).json({ error: 'Failed to stop bot' });
  }
});

// Token Price Endpoint
app.get('/token/price/:address', async (req, res) => {
  try {
    const { address } = req.params;
    // Placeholder implementation
    res.json({ 
      address,
      price: '0.0'
    });
  } catch (error) {
    console.error('Error fetching token price:', error);
    res.status(500).json({ error: 'Failed to fetch token price' });
  }
});

// Gas Price Endpoint
app.get('/network/gas-price', async (req, res) => {
  try {
    // Placeholder implementation
    res.json({
      slow: { price: '5', estimatedTime: '5-10 mins' },
      standard: { price: '6', estimatedTime: '2-5 mins' },
      fast: { price: '7', estimatedTime: '30-60 secs' }
    });
  } catch (error) {
    console.error('Error fetching gas price:', error);
    res.status(500).json({ error: 'Failed to fetch gas price' });
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer });

// Function to broadcast to all clients
const broadcast = (message) => {
  const messageString = JSON.stringify(message);
  console.log('Broadcasting:', messageString);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  // Send initial bot statuses
  const botStatuses = Array.from(activeBots.entries()).map(([address, config]) => ({
    type: 'botStatus',
    data: {
      address,
      status: 'running',
      uptime: Math.floor((Date.now() - config.startTime) / 1000),
      stats: config.stats || {
        totalProfit: '0.00',
        dailyVolume: '0.00',
        successRate: 0
      },
      config: {
        minProfitThreshold: config.minProfitThreshold,
        maxTradeAmount: config.maxTradeAmount
      }
    }
  }));

  botStatuses.forEach(status => {
    ws.send(JSON.stringify(status));
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      if (data.type === 'botConfig') {
        handleBotConfig(ws, data.address, data.config);
      } else {
        ws.send(JSON.stringify({
          type: 'error',
          data: {
            message: 'Unknown message type'
          }
        }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Invalid message format'
        }
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server running on ws://localhost:${port}`);
});
