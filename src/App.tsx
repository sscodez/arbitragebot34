import React, { useState, useEffect } from 'react';
import WalletConnect from './components/WalletConnect';
import TokenPairSelector from './components/TokenPairSelector';
import TradingView from './components/TradingView';
import Console from './components/Dashboard/Console';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import { ethers } from 'ethers';
import { WalletState, Log, SelectedPair, BotStatus } from './types/app';
import wsService from './services/websocket';
import api from './services/api';

function App(): JSX.Element {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
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
  const [settings, setSettings] = useState({
    minProfitThreshold: 0.1,
    maxTradeAmount: 1000
  });
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [gasLimit, setGasLimit] = useState<number>(300000);
  const [gasPrice, setGasPrice] = useState<number>(20); // Default gas price in Gwei
  const [priceUpdates, setPriceUpdates] = useState<{
    [pair: string]: {
      dexA: string;
      dexB: string;
    };
  }>({});
  const [tradeHistory, setTradeHistory] = useState<Array<{
    timestamp: number;
    pair: string;
    profit: string;
    amount: string;
    status: string;
    hash?: string;
  }>>([]);

  useEffect(() => {
    // Connect to WebSocket
    wsService.connect();

    // Subscribe to WebSocket events
    const priceUpdateUnsub = wsService.subscribe('priceUpdate', (data) => {
      if (selectedPair) {
        // Update token prices
        setSelectedPair(prev => prev ? {
          ...prev,
          fromPrice: data[prev.fromToken.address]?.price || prev.fromPrice,
          toPrice: data[prev.toToken.address]?.price || prev.toPrice
        } : null);
      }
    });

    const botStatusUnsub = wsService.subscribe('botStatus', (data) => {
      setBotStatus(prev => ({
        ...prev,
        isRunning: data.status === 'running',
        address: data.address,
        uptime: data.uptime,
        stats: data.stats || prev.stats,
        config: data.config || prev.config
      }));
      addLog('info', `Bot status: ${data.status}`);
    });

    const arbitrageUnsub = wsService.subscribe('arbitrageOpportunity', (data) => {
      addLog('success', `Found arbitrage opportunity: ${data.profit}% profit`);
    });

    const errorUnsub = wsService.subscribe('error', (data) => {
      addLog('error', data.message);
    });

    const transactionUnsub = wsService.subscribe('transactionUpdate', (data) => {
      addLog(data.status === 'success' ? 'success' : 'info', 
        `Transaction ${data.hash}: ${data.status}`);
    });

    const handleWebSocketMessage = (message: any) => {
      switch (message.type) {
        case 'priceUpdate':
          setPriceUpdates(message.data);
          break;

        case 'arbitrageOpportunity':
          addLog('info', `Found arbitrage opportunity: ${message.data.profit}% profit on ${message.data.pair}`);
          addLog('info', `Route: ${message.data.route}`);
          break;

        case 'transactionUpdate':
          setTradeHistory(prev => [{
            timestamp: Date.now(),
            pair: message.data.pair,
            profit: message.data.profit,
            amount: message.data.amount,
            status: message.data.status,
            hash: message.data.hash
          }, ...prev]);
          
          if (message.data.status === 'success') {
            addLog('success', `Trade executed: ${message.data.profit}% profit, Amount: ${message.data.amount} USDT`);
          } else if (message.data.status === 'failed') {
            addLog('error', `Trade failed: ${message.data.error || 'Unknown error'}`);
          }
          break;

        case 'botStatus':
          setBotStatus(prev => ({
            ...prev,
            isRunning: message.data.status === 'running',
            address: message.data.address,
            uptime: message.data.uptime,
            stats: message.data.stats || prev.stats,
            config: message.data.config || prev.config
          }));
          break;

        case 'error':
          addLog('error', message.data.message);
          break;
      }
    };

    wsService.subscribe(handleWebSocketMessage);

    // Fetch initial gas price
    fetchGasPrice();

    // Cleanup subscriptions
    return () => {
      priceUpdateUnsub();
      botStatusUnsub();
      arbitrageUnsub();
      errorUnsub();
      transactionUnsub();
      wsService.unsubscribe(handleWebSocketMessage);
      wsService.disconnect();
    };
  }, [selectedPair]);

  const fetchGasPrice = async () => {
    try {
      const price = await api.getGasPrice();
      setGasPrice(price.fast);
    } catch (error) {
      console.error('Failed to fetch gas price:', error);
    }
  };

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

  const handlePairSelect = (pair: SelectedPair): void => {
    setSelectedPair(pair);
    addLog('info', `Selected pair: ${pair.fromToken.symbol}/${pair.toToken.symbol}`);
  };

  const addLog = (type: Log['type'], message: string): void => {
    setLogs(prev => [...prev, {
      type,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const handleStartBot = async (): Promise<void> => {
    try {
      const response = await api.startBot({
        privateKey,
        slippage,
        gasLimit,
        minProfitThreshold: settings.minProfitThreshold,
        maxTradeAmount: settings.maxTradeAmount
      });
      setBotStatus(prev => ({ ...prev, isRunning: true, address: response.address }));
      addLog('success', 'Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);
      addLog('error', 'Failed to start bot');
    }
  };

  const handleStopBot = async (): Promise<void> => {
    try {
      if (!botStatus.address) {
        throw new Error('No bot wallet address found');
      }
      await api.stopBot(botStatus.address);
      setBotStatus(prev => ({ ...prev, isRunning: false, address: '' }));
      addLog('info', 'Bot stopped successfully');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      addLog('error', 'Failed to stop bot');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar 
        onConnect={handleWalletConnect}
        walletAddress={wallet?.address || ''}
        botStatus={botStatus.isRunning}
        rpcUrl={import.meta.env.VITE_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id'}
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
                    value={settings.minProfitThreshold}
                    onChange={(e) => setSettings(prev => ({ ...prev, minProfitThreshold: Number(e.target.value) }))}
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
                    value={settings.maxTradeAmount}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxTradeAmount: Number(e.target.value) }))}
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

            {/* Price Updates Section */}
            <div className="bg-card rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-2">Current Prices</h3>
              {Object.entries(priceUpdates).map(([pair, prices]) => (
                <div key={pair} className="flex justify-between items-center mb-2">
                  <span>{pair}</span>
                  <div className="flex gap-4">
                    <span>Uniswap: ${prices.dexA}</span>
                    <span>Curve: ${prices.dexB}</span>
                  </div>
                </div>
              ))}
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
          </div>

          {/* Right Column - Trading View and Console */}
          <div className="lg:col-span-8 space-y-6">
            {/* Trading View */}
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

            {/* Console Output */}
            <div className="bg-card rounded-lg shadow-glow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Console Output</h2>
              <div className="h-[400px] overflow-y-auto bg-secondary rounded-lg p-4">
                <ErrorBoundary>
                  <Console logs={logs} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
