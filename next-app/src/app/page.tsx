'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Connection } from '@solana/web3.js';

// Import non-wallet related components normally
import TokenPairSelector from '@/components/TokenPairSelector';
import BotControl from '@/components/BotControl';
import TradingConfig from '@/components/TradingConfig';
import LogViewer from '@/components/LogViewer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { Log, SelectedPair, BotStatus, TradingConfig as TradingConfigType } from '@/types/app';
import { useBot } from '@/hooks/useBot';
import { SolanaDexService } from '@/services/solanaDexService';

// Dynamically import wallet-related components with no SSR
const ClientWallet = dynamic(
  () => import('@/components/ClientWallet').then(mod => mod.default),
  { ssr: false }
);

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>('SOLANA');
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    address: '',
    balance: '0',
  });

  // Add log helper function
  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, metadata?: any) => {
    setLogs(prevLogs => {
      const newLog = {
        id: `${prevLogs.length}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: Date.now(),
        metadata,
        source: 'app'
      };
      console.log(`[App] ${type.toUpperCase()}: ${message}`, metadata || '');
      return [...prevLogs, newLog];
    });
  }, []);

  const {
    isRunning,
    error,
    logs: botLogs,
    startBot,
    stopBot,
    initializeBot,
    setSelectedPair: setBotSelectedPair,
  } = useBot();

  // Initialize bot with Solana connection
  useEffect(() => {
    console.log('[App] Initializing bot...');
    try {
      const connection = new Connection(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
      const service = new SolanaDexService(connection);
      initializeBot(service);
      console.log('[App] Bot initialized successfully');
    } catch (error) {
      console.error('[App] Failed to initialize bot:', error);
      addLog('error', 'Failed to initialize bot: ' + (error instanceof Error ? error.message : String(error)));
    }
  }, [initializeBot, addLog]);

  // Sync bot logs with app logs
  useEffect(() => {
    setLogs(prevLogs => [...prevLogs, ...botLogs]);
  }, [botLogs]);

  // Update bot status
  useEffect(() => {
    setBotStatus(prev => ({
      ...prev,
      isRunning,
      address: walletAddress,
    }));
  }, [isRunning, walletAddress]);

  const [tradingConfig, setTradingConfig] = useState<TradingConfigType>({
    riskTolerance: 50,
    stopLoss: 15,
    autoAdjustStopLoss: false,
    positionSizeLimit: 30,
    leverageLimit: 2,
    alerts: {
      priceChange: true,
      stopLoss: true,
      profitTarget: true
    }
  });

  // Handle pair selection
  const handlePairSelect = useCallback((pair: SelectedPair) => {
    console.log('[App] Pair selected:', pair);
    setSelectedPair(pair);
    setBotSelectedPair(pair);
    addLog('info', `Selected trading pair: ${pair.fromToken.symbol}/${pair.toToken.symbol}`, {
      poolId: pair.poolId,
      fromToken: pair.fromToken.symbol,
      toToken: pair.toToken.symbol
    });
  }, [addLog, setBotSelectedPair]);

  const handleStartBot = useCallback(() => {
    if (!walletAddress) {
      addLog('error', 'Please connect your wallet first');
      return;
    }
    if (!selectedPair) {
      addLog('error', 'Please select a token pair first');
      return;
    }
    try {
      startBot();
      addLog('success', 'Bot started successfully');
    } catch (err) {
      addLog('error', 'Failed to start bot: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [walletAddress, selectedPair, startBot, addLog]);

  const handleStopBot = useCallback(() => {
    try {
      stopBot();
      addLog('info', 'Bot stopped successfully');
    } catch (err) {
      addLog('error', 'Failed to stop bot: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [stopBot, addLog]);

  const handleToggleExecution = useCallback(() => {
    // TODO: Implement auto-execution toggle
    addLog('info', 'Auto-execution toggle not implemented yet');
  }, [addLog]);

  return (
    <ErrorBoundary>
      <ClientWallet
        onConnect={setWalletAddress}
        onDisconnect={() => setWalletAddress('')}
        walletAddress={walletAddress}
      >
        <main className="min-h-screen bg-background">
          <nav className="border-b border-border bg-card">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xl font-bold text-primary">Solana Arbitrage Bot</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Risk Score Card */}
                <div className="card-stats hover-card">
                  <h2 className="text-xl font-semibold text-primary mb-4">Risk Score</h2>
                  <div className="flex items-end space-x-2">
                    <span className="stat-value">85</span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Last updated 2m ago</p>
                </div>

                {/* Token Pair Selection */}
                <div className="card-stats hover-card">
                  <h2 className="text-xl font-semibold text-primary mb-4">Token Pair</h2>
                  <TokenPairSelector
                    chain={selectedChain}
                    onSelect={handlePairSelect}
                    selectedPair={selectedPair}
                  />
                </div>

                {/* Trading Configuration */}
                <div className="card-stats hover-card">
                  <h2 className="text-xl font-semibold text-primary mb-4">Trading Configuration</h2>
                  <TradingConfig
                    config={tradingConfig}
                    onConfigChange={setTradingConfig}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-8 space-y-6">
                {/* Bot Control */}
                <div className="card-stats hover-card">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-primary">Bot Control</h2>
                  </div>
                  <BotControl
                    status={botStatus}
                    onStart={handleStartBot}
                    onStop={handleStopBot}
                    onToggleExecution={handleToggleExecution}
                    isExecutionEnabled={false}
                  />
                </div>

                {/* Log Viewer */}
                <div className="card-stats hover-card">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-primary">Bot Logs</h2>
                  </div>
                  <LogViewer
                    logs={logs}
                    botStatus={botStatus}
                    walletConnected={!!walletAddress}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </ClientWallet>
    </ErrorBoundary>
  );
}
