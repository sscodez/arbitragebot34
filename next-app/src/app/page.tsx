import  { useState, useEffect, useCallback, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { Connection } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';
import PhantomWalletConnect from './components/PhantomWalletConnect';
import TokenPairSelector from './components/TokenPairSelector';
import BotControl from './components/BotControl';
import TradingConfig from './components/TradingConfig';
import LogViewer from './components/LogViewer';
import ErrorBoundary from './components/ErrorBoundary';
import { Log, SelectedPair, BotStatus, TradingConfig as TradingConfigType } from './types/app';
import { useBot } from './hooks/useBot';

function AppContent({ connection }: { connection: Connection }): JSX.Element {


  // Wallet state
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [selectedChain, setSelectedChain] = useState<string>('SOLANA');
  const [logs, setLogs] = useState<Log[]>([]);
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    address: '',
    balance: '0',
  });



  // Add log helper
  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, metadata?: any) => {
    const log = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metadata,
      source: 'app'
    };
    console.log(`[App] ${type}:`, message, metadata || '');
    setLogs(prevLogs => [...prevLogs, log]);
  }, []);

  // Trading state
  const [tradingConfig, setTradingConfig] = useState<TradingConfigType>({
    maxDailyTrades: 50,
    minProfitPercent: 0.5,
    maxTradeAmount: '1000',
    slippageTolerance: 0.5,
  });

  // Bot state
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const [tradeExecutionEnabled, setTradeExecutionEnabled] = useState(false);

  // Bot controls
  const {
    startBot: startBotHook,
    stopBot: stopBotHook,
    isRunning,
    error: botError,
    setSelectedPair: setBotSelectedPair,
    isInitialized: isBotInitialized,
    logs: botLogs
  } = useBot();


    //Handle Pair Selection
    const handlePairSelect = useCallback((pair: SelectedPair) => {
    console.log('[App] Token pair selected:', {
      from: pair.fromToken.symbol,
      to: pair.toToken.symbol
    });
    setSelectedPair(pair);
    setBotSelectedPair(pair);
  }, [setBotSelectedPair]);

  // Stop the bot
  const stopBot = useCallback(() => {
    console.log('[App] Stopping bot...');
    try {
      stopBotHook();
      setBotStatus(prev => ({ ...prev, isRunning: false }));
      addLog('info', 'Bot stopped');
    } catch (err) {
      console.error('[App] Error stopping bot:', err);
      addLog('error', err instanceof Error ? err.message : 'Failed to stop bot');
    }
  }, [stopBotHook, addLog]);


  // Handle wallet connection
  const handleWalletDisconnect = useCallback(() => {
    console.log('[App] Wallet disconnected');
    setWalletAddress('');
    setBotStatus(prev => ({ ...prev, address: '', isRunning: false }));
    stopBot();
    addLog('info', 'Wallet disconnected');
  }, [stopBot, addLog]);

  // Handle wallet connection
  const handleWalletConnect = useCallback((address: string) => {
    console.log('[App] Wallet connected:', {
      address,
      connection: {
        endpoint: connection.rpcEndpoint,
        commitment: connection.commitment
      }
    });
    setWalletAddress(address);
    setBotStatus(prev => ({ ...prev, address }));
    addLog('success', `Connected to wallet: ${address}`);
  }, [connection, addLog]);

  // Start the bot
  const startBot = useCallback(() => {
    console.log('[App] Starting bot...', {
      walletAddress,
      selectedPair: selectedPair ? {
        fromToken: {
          symbol: selectedPair.fromToken.symbol,
          address: selectedPair.fromToken.address
        },
        toToken: {
          symbol: selectedPair.toToken.symbol,
          address: selectedPair.toToken.address
        }
      } : null,
      chain: selectedChain,
      isInitialized: isBotInitialized,
      connection: {
        endpoint: connection.rpcEndpoint,
        commitment: connection.commitment
      }
    });

    if (!walletAddress) {
      const error = 'Please connect your wallet first';
      console.error('[App] Start failed:', error);
      addLog('error', error);
      return;
    }

    if (!isBotInitialized) {
      const error = 'Bot is not ready yet. Please wait for initialization to complete.';
      console.error('[App] Start failed:', error);
      addLog('error', error);
      return;
    }

    if (!selectedPair) {
      const error = 'Please select a token pair first';
      console.error('[App] Start failed:', error);
      addLog('error', error);
      return;
    }

    try {
      console.log('[App] Calling startBotHook...');
      startBotHook();
      console.log('[App] Bot hook started');
      
      setBotStatus(prev => ({ ...prev, isRunning: true }));
      addLog('success', 'Bot started successfully');
    } catch (err) {
      console.error('[App] Error starting bot:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        details: err
      });
      addLog('error', err instanceof Error ? err.message : 'Failed to start bot');
    }
  }, [walletAddress, selectedPair, startBotHook, selectedChain, isBotInitialized, connection, addLog]);

  // Handle chain selection

  const handleChainSelect = useCallback((chain: string) => {
    setSelectedChain(chain);
    addLog('info', `Switched to ${chain} chain`);
    
    // Reset selected pair when changing chains
    setSelectedPair(null);
    setBotSelectedPair(null);
  }, [setBotSelectedPair, addLog]);

  const toggleTradeExecution = useCallback(() => {
    if (!walletAddress) {
      addLog('error', 'Please connect your wallet first');
      return;
    }

    
    setTradeExecutionEnabled(prev => !prev);
    addLog('info', `Trade execution ${tradeExecutionEnabled ? 'disabled' : 'enabled'}`);
  }, [walletAddress, tradeExecutionEnabled, addLog]);

  const handleConfigChange = useCallback((newConfig: TradingConfigType) => {
    setTradingConfig(newConfig);
    addLog('info', 'Trading configuration updated');
  }, [addLog]);


  // Clear Logs

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // Effect to update bot status when isRunning changes
  useEffect(() => {
    console.log('[App] Bot running status changed:', isRunning);
    setBotStatus(prev => ({ ...prev, isRunning }));
  }, [isRunning]);

  // Effect to sync bot logs
  useEffect(() => {
    if (botLogs.length > 0) {
      setLogs(prevLogs => {
        const uniqueLogs = new Map();
        
        // Add existing logs to map
        prevLogs.forEach((log:any) => {
          uniqueLogs.set(log.id, log);
        });
        
        // Add new logs, overwriting any duplicates
        botLogs.forEach(log => {
          uniqueLogs.set(log.id, log);
        });
        
        // Convert map back to array and sort by timestamp
        return Array.from(uniqueLogs.values())
          .sort((a, b) => a.timestamp - b.timestamp);
      });
    }
  }, [botLogs]);

  // Effect to handle bot errors
  useEffect(() => {
    if (botError) {
      addLog('error', botError);
    }
  }, [botError, addLog]);

  // Effect to update bot status when wallet changes
  useEffect(() => {
    console.log('[App] Wallet state changed:', {
      address: walletAddress,
      isInitialized: isBotInitialized
    });
    
    setBotStatus(prev => ({
      ...prev,
      address: walletAddress,
      isRunning: prev.isRunning && !!walletAddress && isBotInitialized
    }));
  }, [walletAddress, isBotInitialized]);

  // Effect to initialize services when wallet connects
  useEffect(() => {
    if (walletAddress) {
      console.log('[App] Initializing services after wallet connection:', {
        address: walletAddress,
        chain: selectedChain
      });
    }
  }, [walletAddress, selectedChain]);

  // Monitor bot state
  useEffect(() => {
    console.log('[App] Bot state changed:', {
      isRunning,
      walletAddress,
      selectedPair: selectedPair ? `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}` : null,
      isBotInitialized,
      botError
    });

    if (botError) {
      console.error('[App] Bot error:', botError);
      addLog('error', botError);
    }
  }, [isRunning, walletAddress, selectedPair, isBotInitialized, botError, addLog]);

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

            {/* Phantom Wallet*/}
              <PhantomWalletConnect
                onConnect={handleWalletConnect}
                onDisconnect={handleWalletDisconnect}
                selectedChain={selectedChain}
                onChainChange={handleChainSelect}
              />
            </ErrorBoundary>

            {/* Token Pair Selector */}
            <div className="bg-card rounded-lg shadow-glow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-primary">Token Pair</h2>
              <TokenPairSelector
                chain={selectedChain}
                selectedPair={selectedPair}
                onPairSelect={handlePairSelect}
              />
            </div>


            {/* Bot Control */}
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
            {/* Trading Config   */}
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
            {/* Bot Logs */}
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
  // Initialize Solana connection with Alchemy endpoint
  const endpoint = useMemo(() => {
    const envEndpoint = import.meta.env.VITE_SOLANA_RPC_URL;
    return envEndpoint && envEndpoint.startsWith('http') 
      ? envEndpoint 
      : 'https://api.mainnet-beta.solana.com';
  }, []);

  console.log('[App] Using RPC endpoint:', endpoint);
  
  // You can add more wallets here
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  const connection = useMemo(() => new Connection(endpoint, 'confirmed'), [endpoint]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent connection={connection} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
