import { Buffer } from 'buffer';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

import PhantomWalletConnect from './components/PhantomWalletConnect';
import TokenPairSelector from './components/TokenPairSelector';
import BotControl from './components/BotControl';
import TradingConfig from './components/TradingConfig';
import StatCard from './components/StatCard';
import PriceChart from './components/PriceChart';
import TradeHistory from './components/TradeHistory';
import LogViewer from './components/LogViewer';
import ErrorBoundary from './components/ErrorBoundary';

import { WalletState, Log, SelectedPair, BotStatus, TradingConfig as TradingConfigType } from './types/app';
import { useArbitrage } from './hooks/useArbitrage';
import { useBot } from './hooks/useBot';
import { SUPPORTED_CHAINS } from '@/constant/chains';
import { SolanaPoolService } from '@/services/SolanaPoolService';
import { SolanaTokenService } from '@/services/SolanaTokenService';
import { ArbitrageService } from '@/services/ArbitrageService';

function AppContent(): JSX.Element {
  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>('SOLANA');
  const [logs, setLogs] = useState<Log[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    address: '',
    balance: '0',
  });

  // Trading state
  const [tradingConfig, setTradingConfig] = useState<TradingConfigType>({
    maxDailyTrades: 50,
    minProfitPercent: 0.5,
    maxTradeAmount: '1000',
    slippageTolerance: 0.5,
  });

  const [tradingStats, setTradingStats] = useState({
    dailyTrades: 0,
    lastTradeTimestamp: 0,
    successfulTrades: 0,
    failedTrades: 0,
    totalProfit: '0',
  });

  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const [tradeExecutionEnabled, setTradeExecutionEnabled] = useState(false);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Array<{
    timestamp: number;
    pair: string;
    profit: string;
    route: string;
    status: string;
  }>>([]);

  // Handle wallet connection
  const handleWalletConnect = useCallback((address: string) => {
    setWalletAddress(address);
    addLog('success', `Connected to wallet: ${address}`);
  }, []);

  // Handle wallet disconnection
  const handleWalletDisconnect = useCallback(() => {
    setWalletAddress('');
    addLog('info', 'Disconnected from wallet');
    
    if (botStatus.isRunning) {
      stopBot();
    }
  }, [botStatus.isRunning]);

  // Handle chain selection
  const handleChainSelect = useCallback((chain: string) => {
    setSelectedChain(chain);
    addLog('info', `Switched to ${chain} chain`);
    
    // Reset selected pair when changing chains
    setSelectedPair(null);
  }, []);

  // Bot controls
  const startBot = useCallback(() => {
    if (!walletAddress) {
      addLog('error', 'Please connect your wallet first');
      return;
    }
    if (!selectedPair) {
      addLog('error', 'Please select a token pair first');
      return;
    }
    
    setBotStatus(prev => ({ ...prev, isRunning: true }));
    addLog('success', 'Bot started');
  }, [walletAddress, selectedPair]);

  const stopBot = useCallback(() => {
    setBotStatus(prev => ({ ...prev, isRunning: false }));
    addLog('info', 'Bot stopped');
  }, []);

  // Handle trade execution toggle
  const toggleTradeExecution = useCallback(() => {
    if (!walletAddress) {
      addLog('error', 'Please connect your wallet first');
      return;
    }
    
    setTradeExecutionEnabled(prev => !prev);
    addLog('info', `Trade execution ${tradeExecutionEnabled ? 'disabled' : 'enabled'}`);
  }, [walletAddress, tradeExecutionEnabled]);

  // Handle config changes
  const handleConfigChange = useCallback((newConfig: TradingConfigType) => {
    setTradingConfig(newConfig);
    addLog('info', 'Trading configuration updated');
  }, []);

  // Logging functionality
  const addLog = useCallback((type: 'info' | 'success' | 'error' | 'warning', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: Date.now() }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Arbitrage Bot</h1>
          <p className="text-muted-foreground">Multi-Chain DEX Arbitrage Bot</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left column */}
          <div className="md:col-span-3 space-y-6">
            <ErrorBoundary>
              <PhantomWalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                selectedChain={selectedChain}
                onChainChange={handleChainSelect}
              />
            </ErrorBoundary>

            <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-primary">Token Pair</h2>
              <TokenPairSelector
                chain={selectedChain}
                selectedPair={selectedPair}
                onPairSelect={setSelectedPair}
              />
            </div>

            <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-primary">Bot Control</h2>
              <BotControl
                status={botStatus}
                onStart={startBot}
                onStop={stopBot}
                onToggleExecution={toggleTradeExecution}
                isExecutionEnabled={tradeExecutionEnabled}
              />
            </div>

            <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-primary">Trading Config</h2>
              <TradingConfig
                config={tradingConfig}
                onConfigChange={handleConfigChange}
              />
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-9 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Daily Trades"
                value={tradingStats.dailyTrades.toString()}
                description="Trades executed today"
              />
              <StatCard
                title="Success Rate"
                value={`${((tradingStats.successfulTrades / (tradingStats.successfulTrades + tradingStats.failedTrades)) * 100).toFixed(1)}%`}
                description="Successful trades ratio"
              />
              <StatCard
                title="Total Profit"
                value={`${parseFloat(tradingStats.totalProfit).toFixed(4)}`}
                description={`Profit in ${selectedPair?.fromToken.symbol || 'tokens'}`}
              />
              <StatCard
                title="Chain"
                value={SUPPORTED_CHAINS[selectedChain].name}
                description="Current blockchain"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
                <h2 className="text-xl font-semibold text-primary">Price Chart</h2>
                <PriceChart prices={priceHistory} pair={selectedPair} />
              </div>

              <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
                <h2 className="text-xl font-semibold text-primary">Trade History</h2>
                <TradeHistory trades={tradeHistory} />
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-primary">Bot Logs</h2>
                <button
                  onClick={clearLogs}
                  className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-all"
                >
                  Clear Logs
                </button>
              </div>
              <LogViewer logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App(): JSX.Element {
  // Initialize Solana wallet adapter
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // You can add more wallets here
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
