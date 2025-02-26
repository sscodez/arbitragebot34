import { useState, useCallback, useEffect } from 'react';
import { useArbitrage } from './useArbitrage';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';

interface SelectedPair {
  fromToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  toToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
}

interface Log {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: number;
  metadata?: any;
  source: string;
}

const SEARCH_INTERVAL_MS = 30000;

export const useBot = () => {
  console.log('[useBot] Initializing hook');
  
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const [minProfitPercent, setMinProfitPercent] = useState(1);
  const [lastOpportunity, setLastOpportunity] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [searchIntervalId, setSearchIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);

  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, metadata?: any) => {
    const log = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: Date.now(),
      metadata,
      source: 'bot'
    };
    console.log(`[useBot] ${type}:`, message, metadata || '');
    setLogs(prevLogs => [...prevLogs, log]);
  }, []);

  const { 
    findOpportunities, 
    executeArbitrage, 
    opportunities, 
    isSearching,
    isInitialized,
    error: arbitrageError 
  } = useArbitrage({
    onLog: (type, message, metadata) => {
      addLog(type, message, metadata);
    }
  });

  const { connection } = useConnection();
  const { connected: isConnected, publicKey, wallet } = useWallet();

  useEffect(() => {
    console.log('[useBot] State changed:', {
      isConnected,
      publicKey: publicKey?.toString(),
      isInitialized,
      isRunning,
      selectedPair: selectedPair ? `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}` : null,
      error,
      arbitrageError
    });
  }, [isConnected, publicKey, isInitialized, isRunning, selectedPair, error, arbitrageError]);

  const stopBot = useCallback(() => {
    console.log('[useBot] Stopping bot');
    
    if (searchIntervalId) {
      clearInterval(searchIntervalId);
      setSearchIntervalId(null);
    }
    
    setIsRunning(false);
    setError(null);
  }, [searchIntervalId]);

  const searchForOpportunities = useCallback(async () => {
    if (!isRunning) {
      console.log('[useBot] Bot is stopped, skipping search');
      return;
    }

    console.log('[useBot] Starting search with state:', {
      isRunning,
      isInitialized,
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
      minProfitPercent
    });

    if (!selectedPair) {
      console.log('[useBot] Search skipped, no pair selected');
      return;
    }

    if (!isInitialized) {
      console.error('[useBot] Cannot search, not initialized');
      setError('Bot is not initialized');
      stopBot();
      return;
    }

    try {
      if (!isRunning) return; // Check if bot was stopped during initialization

      console.log('[useBot] Searching for opportunities:', {
        pair: `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`,
        minProfit: minProfitPercent,
        addresses: {
          from: selectedPair.fromToken.address,
          to: selectedPair.toToken.address
        }
      });

      const { fromToken, toToken } = selectedPair;
      const results = await findOpportunities(
        fromToken.address,
        toToken.address,
        minProfitPercent
      );

      if (!isRunning) return; // Check if bot was stopped during search

      console.log('[useBot] Search completed:', {
        foundOpportunities: results.length,
        firstOpportunity: results[0] ? {
          profitPercent: results[0].profitPercent,
          route: results[0].route
        } : null
      });

      if (results && results.length > 0) {
        if (!isRunning) return; // Check if bot was stopped before executing trade

        console.log('[useBot] Found opportunity:', {
          opportunity: results[0],
          profitPercent: results[0].profitPercent
        });
        
        if (results[0].profitPercent >= minProfitPercent) {
          console.log('[useBot] Executing arbitrage:', {
            profit: results[0].profitPercent,
            threshold: minProfitPercent
          });

          await executeArbitrage(
            fromToken.address,
            toToken.address,
            '1',
            fromToken.symbol,
            toToken.symbol,
            results[0].route
          );
        }
      } else {
        if (!isRunning) return; // Check if bot was stopped after search
        console.log('[useBot] No opportunities found');
      }
    } catch (err) {
      if (!isRunning) return; // Check if bot was stopped during error

      const errorMsg = err instanceof Error ? err.message : 'Failed to search for opportunities';
      console.error('[useBot] Search failed:', {
        error: errorMsg,
        details: err
      });
      setError(errorMsg);
      stopBot();
    }
  }, [selectedPair, minProfitPercent, findOpportunities, executeArbitrage, isInitialized, stopBot, isRunning]);

  const startBot = useCallback(() => {
    console.log('[useBot] Starting bot:', {
      isRunning,
      selectedPair: selectedPair ? {
        fromToken: selectedPair.fromToken.symbol,
        toToken: selectedPair.toToken.symbol
      } : null,
      isInitialized,
      isConnected,
      publicKey: publicKey?.toString()
    });

    if (!isConnected || !publicKey) {
      const error = 'Please connect your wallet first';
      console.error('[useBot] Cannot start:', error);
      setError(error);
      return;
    }

    if (!isInitialized) {
      const error = 'Service not initialized yet';
      console.error('[useBot] Cannot start:', error);
      setError(error);
      return;
    }

    if (!selectedPair) {
      const error = 'Please select a token pair first';
      console.error('[useBot] Cannot start:', error);
      setError(error);
      return;
    }

    try {
      setIsRunning(true);
      setError(null);

      // Start search interval
      const intervalId = setInterval(searchForOpportunities, SEARCH_INTERVAL_MS);
      setSearchIntervalId(intervalId);

      // Trigger initial search
      searchForOpportunities();

      console.log('[useBot] Bot started successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start bot';
      console.error('[useBot] Start failed:', errorMsg);
      setError(errorMsg);
      setIsRunning(false);
    }
  }, [selectedPair, searchForOpportunities, isInitialized, isConnected, publicKey]);

  useEffect(() => {
    return () => {
      if (searchIntervalId) {
        clearInterval(searchIntervalId);
      }
    };
  }, [searchIntervalId]);

  useEffect(() => {
    console.log('[useBot] Checking initialization:', {
      isRunning,
      hasSelectedPair: !!selectedPair,
      arbitrageInitialized: isInitialized
    });

    if (isInitialized) {
      setError(null);
    }
  }, [isInitialized, selectedPair]);

  useEffect(() => {
    if ((!isConnected || !isInitialized) && isRunning) {
      addLog('error', 'Dependencies lost, stopping bot', {
        isConnected,
        isInitialized
      });
      stopBot();
      
      if (!isConnected) {
        setError('Wallet disconnected');
      } else if (!isInitialized) {
        setError('Arbitrage service not initialized');
      }
    }
  }, [isConnected, isInitialized, isRunning, addLog, stopBot]);

  useEffect(() => {
    if (arbitrageError && isRunning) {
      addLog('error', arbitrageError);
      stopBot();
    }
  }, [arbitrageError, isRunning, addLog, stopBot]);

  return {
    isRunning,
    startBot,
    stopBot,
    setSelectedPair,
    error,
    isInitialized,
    opportunities,
    isSearching,
    lastOpportunity,
    logs
  };
};
