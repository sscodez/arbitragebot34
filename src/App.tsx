import React, { useState, useEffect, useCallback } from 'react';
import WalletConnect from './components/WalletConnect';
import TokenPairSelector from './components/TokenPairSelector';
import TradingView from './components/TradingView';
import Console from './components/Dashboard/Console';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { ethers } from 'ethers';
import { WalletState, Log, SelectedPair, BotStatus } from './types/app';
import DexService from './services/dexService';
import api from './services/api';

function App(): JSX.Element {
  // State for wallet and provider
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [dexService, setDexService] = useState<DexService | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [rpcUrl] = useState<string>(
    import.meta.env.VITE_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key'
  );
  
  // Trading configuration state
  const [tradingConfig, setTradingConfig] = useState<TradingConfig>({
    maxDailyTrades: 50,
    minProfitPercent: 0.5,
    maxTradeAmount: '1000',
    minTradeAmount: '100',
    slippageTolerance: 0.5,
  });

  // Trading stats state
  const [tradingStats, setTradingStats] = useState<TradingStats>({
    dailyTrades: 0,
    lastTradeTimestamp: 0,
    totalProfit: '0',
    successfulTrades: 0,
    failedTrades: 0
  });

  // Bot status and monitoring state
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    address: '',
    uptime: 0,
    stats: {
      totalProfit: '0.00',
      dailyVolume: '0.00',
      successRate: 0
    },
    config: {
      minProfitThreshold: 0.1,
      maxTradeAmount: 1000
    }
  });
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  // Token pair state
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);

  // Logs state
  const [logs, setLogs] = useState<Log[]>([]);

  // Slippage state
  const [slippage, setSlippage] = useState<number>(0.5);

  // Gas limit state
  const [gasLimit, setGasLimit] = useState<number>(300000);

  // Gas price state
  const [gasPrice, setGasPrice] = useState<number>(20);

  // Trade history state
  const [tradeHistory, setTradeHistory] = useState<Array<{
    timestamp: number;
    pair: string;
    profit: string;
    amount: string;
    status: string;
    hash?: string;
  }>>([]);

  // Current prices state
  const [currentPrices, setCurrentPrices] = useState<{
    [dex: string]: {
      price: string;
      liquidityUSD: string;
    } | null;
  }>({});

  // Price update interval state
  const [priceUpdateInterval, setPriceUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Initialize wallet from private key
  const initializeWalletFromPrivateKey = async (key: string) => {
    try {
      // Create JsonRpcProvider with explicit network configuration
      const jsonRpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl, {
        name: 'mainnet',
        chainId: 1
      });

      // Wait for the network to be ready
      await jsonRpcProvider.ready;

      // Create wallet instance
      const wallet = new ethers.Wallet(key, jsonRpcProvider);
      const address = await wallet.getAddress();

      // Initialize DexService with the wallet
      const dexServiceInstance = new DexService(wallet);
      setDexService(dexServiceInstance);

      // Update state
      setWallet({ address, balance: '0' });
      setWalletAddress(address);
      setProvider(jsonRpcProvider as any);

      // Get and set initial balance
      const balance = await jsonRpcProvider.getBalance(address);
      setWallet(prev => ({ ...prev!, balance: ethers.utils.formatEther(balance) }));

      addLog('success', `Wallet connected successfully: ${address}`);
      return true;
    } catch (error: any) {
      console.error('Wallet initialization error:', error);
      addLog('error', `Failed to initialize wallet: ${error.message}`);
      return false;
    }
  };

  // Reset daily stats at midnight
  const resetDailyStats = useCallback(() => {
    const now = new Date();
    const lastResetDate = new Date(tradingStats.lastTradeTimestamp);
    
    // Only reset if it's a new day and we have stats to reset
    if (
      now.getDate() !== lastResetDate.getDate() &&
      tradingStats.dailyTrades > 0
    ) {
      setTradingStats(prev => ({
        ...prev,
        dailyTrades: 0,
        lastTradeTimestamp: now.getTime()
      }));
      addLog('info', 'Daily trading stats reset');
    }
  }, [tradingStats.lastTradeTimestamp, tradingStats.dailyTrades]);

  // Execute arbitrage trade functionality
  const executeArbitrageTrade = useCallback(async (opportunity: ArbitrageOpportunity) => {
    if (!dexService || !wallet || tradingStats.dailyTrades >= tradingConfig.maxDailyTrades) {
      return;
    }

    try {
      // Execute buy trade
      addLog('info', `Executing buy trade on ${opportunity.buyDex}`);
      const buyResult = await dexService.executeTrade({
        tokenIn: selectedPair!.fromToken,
        tokenOut: selectedPair!.toToken,
        amount: tradingConfig.minTradeAmount,
        dex: opportunity.buyDex,
        slippageTolerance: tradingConfig.slippageTolerance
      });

      if (!buyResult.success) {
        addLog('error', `Buy trade failed: ${buyResult.error}`);
        setTradingStats(prev => ({
          ...prev,
          failedTrades: prev.failedTrades + 1,
          lastTradeTimestamp: Date.now()
        }));
        return;
      }

      // Execute sell trade
      addLog('info', `Executing sell trade on ${opportunity.sellDex}`);
      const sellResult = await dexService.executeTrade({
        tokenIn: selectedPair!.toToken,
        tokenOut: selectedPair!.fromToken,
        amount: buyResult.outputAmount!,
        dex: opportunity.sellDex,
        slippageTolerance: tradingConfig.slippageTolerance
      });

      if (!sellResult.success) {
        addLog('error', `Sell trade failed: ${sellResult.error}`);
        setTradingStats(prev => ({
          ...prev,
          failedTrades: prev.failedTrades + 1,
          lastTradeTimestamp: Date.now()
        }));
        return;
      }

      // Update stats
      const profit = parseFloat(opportunity.expectedProfit);
      setTradingStats(prev => ({
        ...prev,
        dailyTrades: prev.dailyTrades + 1,
        lastTradeTimestamp: Date.now(),
        successfulTrades: prev.successfulTrades + 1,
        totalProfit: (parseFloat(prev.totalProfit) + profit).toString()
      }));

      addLog('success', `Arbitrage trade completed successfully! Profit: ${profit.toFixed(4)} ${selectedPair!.fromToken.symbol}`);
    } catch (error: any) {
      addLog('error', `Trade execution failed: ${error.message}`);
      setTradingStats(prev => ({
        ...prev,
        failedTrades: prev.failedTrades + 1,
        lastTradeTimestamp: Date.now()
      }));
    }
  }, [dexService, wallet, selectedPair, tradingConfig, tradingStats.dailyTrades]);

  // Start bot functionality
  const startBot = useCallback(async () => {
    if (!dexService || !selectedPair) {
      addLog('error', 'DexService or selected pair not initialized');
      return;
    }

    setBotStatus(prev => ({ ...prev, isRunning: true }));

    // Set up monitoring interval
    const interval = setInterval(async () => {
      try {
        // First update prices
        await updatePrices();

        // Check for arbitrage opportunities
        const opportunities = await dexService.findArbitrageOpportunities(
          selectedPair.fromToken,
          selectedPair.toToken,
          tradingConfig.minTradeAmount
        );

        if (opportunities.length > 0) {
          addLog('info', `Found ${opportunities.length} arbitrage opportunities:`);
          opportunities.forEach(opp => {
            addLog('info', `  ${opp.route} - Profit: ${opp.profitPercent}%`);
          });

          // Execute the most profitable trade if it meets our criteria
          const bestOpportunity = opportunities[0];
          if (parseFloat(bestOpportunity.profitPercent) >= tradingConfig.minProfitPercent) {
            addLog('info', `Executing trade with ${bestOpportunity.profitPercent}% profit potential`);
            await executeArbitrageTrade(bestOpportunity);
          }
        }
      } catch (error: any) {
        console.error('Error in monitoring loop:', error);
        addLog('error', `Error monitoring opportunities: ${error.message}`);
      }
    }, 10000); // Check every 10 seconds

    setMonitoringInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dexService, selectedPair, tradingConfig, executeArbitrageTrade]);

  // Stop bot functionality
  const stopBot = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
    }
    setBotStatus(prev => ({ ...prev, isRunning: false }));
    addLog('info', 'Bot stopped');
  }, [monitoringInterval]);

  // Add log functionality
  const addLog = (type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: Date.now() }]);
  };

  // Handle start bot functionality
  const handleStartBot = async () => {
    if (!selectedPair) {
      addLog('error', 'Please select a token pair first');
      return;
    }

    if (!privateKey) {
      addLog('error', 'Please enter your private key first');
      return;
    }

    if (!provider) {
      try {
        const wallet = await initializeWalletFromPrivateKey(privateKey);
        if (!wallet) {
          return;
        }
      } catch (error) {
        addLog('error', `Failed to initialize wallet: ${error}`);
        return;
      }
    }

    if (botStatus.isRunning) {
      addLog('warning', 'Bot is already running');
      return;
    }

    try {
      addLog('info', 'Starting arbitrage bot...');
      addLog('info', `Token pair: ${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`);
      addLog('info', `Min profit threshold: ${tradingConfig.minProfitPercent}%`);
      addLog('info', `Max trade amount: ${tradingConfig.maxTradeAmount} ${selectedPair.fromToken.symbol}`);
      
      await startBot();
      
      addLog('success', 'Bot started successfully');
      addLog('info', 'Monitoring prices for arbitrage opportunities...');
      
      // Start price updates
      updatePrices();
    } catch (error) {
      addLog('error', `Failed to start bot: ${error}`);
    }
  };

  // Handle stop bot functionality
  const handleStopBot = async () => {
    if (!botStatus.isRunning) {
      addLog('warning', 'Bot is not running');
      return;
    }

    try {
      stopBot();
      addLog('info', 'Bot stopped successfully');
      
      if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
        setPriceUpdateInterval(null);
      }
    } catch (error) {
      addLog('error', `Failed to stop bot: ${error}`);
    }
  };

  // Handle wallet connect functionality
  const handleWalletConnect = async ({ address }: { address: string }): Promise<void> => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      setProvider(provider);
      setWalletAddress(address);
      setWallet({ address, signer });
      addLog('success', 'Wallet connected successfully');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      addLog('error', 'Failed to connect wallet');
    }
  };

  // Handle pair select functionality
  const handlePairSelect = (pair: SelectedPair): void => {
    setSelectedPair(pair);
    addLog('info', `Selected pair: ${pair.fromToken.symbol}/${pair.toToken.symbol}`);
  };

  // Fetch gas price functionality
  const fetchGasPrice = async () => {
    try {
      const price = await api.getGasPrice();
      setGasPrice(price.fast);
    } catch (error) {
      console.error('Failed to fetch gas price:', error);
    }
  };

  // Handle console command functionality
  const handleConsoleCommand = (command: string) => {
    if (command === 'clear') {
      setLogs([]);
      return;
    }
    addLog('info', command);
  };

  // Update prices functionality
  const updatePrices = async () => {
    if (!dexService || !selectedPair) {
      return;
    }

    try {
      const prices = await dexService.getCurrentPrices(
        selectedPair.fromToken,
        selectedPair.toToken,
        tradingConfig.minTradeAmount
      );
      setCurrentPrices(prices);
      
      // Log prices to console
      addLog('info', `Current prices for ${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}:`);
      Object.entries(prices).forEach(([dex, data]) => {
        addLog('info', `  ${dex}: ${parseFloat(data.price).toFixed(8)} ${selectedPair.toToken.symbol}/${selectedPair.fromToken.symbol}`);
      });
    } catch (error: any) {
      console.error('Error updating prices:', error);
      addLog('error', `Failed to update prices: ${error.message}`);
    }
  };

  // Start price updates on bot start
  useEffect(() => {
    if (botStatus.isRunning && selectedPair && dexService) {
      // Initial price update
      updatePrices();

      // Set up interval for price updates
      const interval = setInterval(updatePrices, 10000); // Update every 10 seconds
      setPriceUpdateInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [botStatus.isRunning, selectedPair, dexService]);

  // Effect for resetting daily stats
  useEffect(() => {
    const checkResetInterval = setInterval(resetDailyStats, 60000); // Check every minute
    return () => clearInterval(checkResetInterval);
  }, [resetDailyStats]);

  // Initialize wallet when private key is available
  useEffect(() => {
    if (privateKey && !provider) {
      initializeWalletFromPrivateKey(privateKey);
    }
  }, [privateKey, provider, rpcUrl]);

  // Clean up monitoring interval
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // Render JSX
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onConnect={handleWalletConnect}
        walletAddress={wallet?.address || ''}
        botStatus={botStatus.isRunning}
        rpcUrl={rpcUrl}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Bot Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Wallet Info */}
            <div className="bg-card rounded-lg shadow-glow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Wallet Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Private Key
                  </label>
                  <input
                    type="password"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder="Enter your private key"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your private key is stored locally and never sent to any server
                  </p>
                </div>
              </div>
            </div>

            {/* Bot Controls */}
            <div className="bg-card rounded-lg shadow-glow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Bot Controls</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Slippage Tolerance (%)
                  </label>
                  <input
                    type="number"
                    value={slippage}
                    onChange={(e) => setSlippage(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    step="0.1"
                    min="0.1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Gas Limit
                  </label>
                  <input
                    type="number"
                    value={gasLimit}
                    onChange={(e) => setGasLimit(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    step="1000"
                    min="21000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Gas Price (Gwei)
                  </label>
                  <input
                    type="number"
                    value={gasPrice}
                    onChange={(e) => setGasPrice(Number(e.target.value))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    placeholder="Enter gas price"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Minimum Profit Threshold (%)
                  </label>
                  <input
                    type="number"
                    value={tradingConfig.minProfitPercent}
                    onChange={(e) => setTradingConfig(prev => ({ ...prev, minProfitPercent: Number(e.target.value) }))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    step="0.01"
                    min="0.01"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Max Trade Amount (USDT)
                  </label>
                  <input
                    type="number"
                    value={tradingConfig.maxTradeAmount}
                    onChange={(e) => setTradingConfig(prev => ({ ...prev, maxTradeAmount: Number(e.target.value) }))}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                    step="100"
                    min="1"
                    max="100000"
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleStartBot}
                    disabled={botStatus.isRunning}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      botStatus.isRunning
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    Start Bot
                  </button>
                  <button
                    onClick={handleStopBot}
                    disabled={!botStatus.isRunning}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                      !botStatus.isRunning
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    }`}
                  >
                    Stop Bot
                  </button>
                </div>
              </div>
            </div>

            {/* Token Pair Selector */}
            <div className="bg-card rounded-lg shadow-glow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Select Token Pair</h2>
              <TokenPairSelector 
                onPairSelect={handlePairSelect}
                provider={provider}
                walletAddress={walletAddress}
              />
            </div>

            {/* Current Prices Section */}
            <div className="bg-card rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2">Current Prices</h3>
              {selectedPair ? (
                <div>
                  <div className="text-sm text-gray-500 mb-2">
                    {selectedPair.fromToken.symbol}/{selectedPair.toToken.symbol}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(currentPrices).map(([dex, data]) => (
                      <div key={dex} className="bg-background p-3 rounded-lg">
                        <div className="font-medium text-primary">{dex}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Price:</span>
                          <span className="font-medium">
                            {data ? `$${parseFloat(data.price).toFixed(6)}` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-sm">Liquidity:</span>
                          <span className="font-medium">
                            {data ? `$${parseFloat(data.liquidityUSD).toLocaleString()}` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  Select a token pair to view prices
                </div>
              )}
            </div>

            {/* Trade History Section */}
            <div className="bg-card rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Recent Trades</h3>
              <div className="space-y-2">
                {tradeHistory.map((trade, index) => (
                  <div key={index} className={`p-2 rounded ${
                    trade.status === 'success' ? 'bg-success/10' :
                    trade.status === 'failed' ? 'bg-destructive/10' :
                    'bg-muted'
                  }`}>
                    <div className="flex justify-between">
                      <span>{trade.pair}</span>
                      <span className={
                        trade.status === 'success' ? 'text-success' :
                        trade.status === 'failed' ? 'text-destructive' :
                        'text-muted-foreground'
                      }>
                        {trade.status === 'success' ? `+${trade.profit}%` : trade.status}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: {trade.amount} USDT
                      {trade.hash && (
                        <span className="ml-2">
                          Tx: {trade.hash.slice(0, 6)}...{trade.hash.slice(-4)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Console Section */}
         

          {/* Right Column - Trading View */}
          <div className="lg:col-span-8 space-y-6">
            {/* Trading View */}

            <div className="bg-card rounded-lg p-4 h-[400px]">
              <h3 className="text-lg font-semibold mb-2">Console</h3>
              <Console 
                logs={logs}
                onCommand={handleConsoleCommand}
                isRunning={botStatus.isRunning}
                onStartBot={handleStartBot}
                onStopBot={handleStopBot}
              />
            </div>
          </div>
            <div className="bg-card rounded-lg shadow-glow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary">Trading View</h2>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    botStatus.isRunning
                      ? 'bg-primary/20 text-primary'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      botStatus.isRunning ? 'bg-primary' : 'bg-destructive'
                    }`}></span>
                    {botStatus.isRunning ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
              <TradingView 
                selectedPair={selectedPair}
                provider={provider}
                walletAddress={walletAddress}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
