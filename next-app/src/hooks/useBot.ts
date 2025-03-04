import { useCallback, useRef, useState } from 'react';
import { TokenInfo } from '@/types/token';
import { SolanaDexService } from '@/services/solanaDexService';
import { SelectedPair } from '@/types/app';
import { BOT_CHECK_INTERVAL } from '@/config/constants';
import Big from 'big.js';

export const useBot = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  const logCounterRef = useRef(0);
  const serviceRef = useRef<SolanaDexService | null>(null);
  const selectedPairRef = useRef<SelectedPair | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, metadata?: any) => {
    setLogs(prevLogs => {
      // Generate a unique ID using UUID-like format
      const uniqueId = `${Date.now()}-${logCounterRef.current++}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
      
      const newLog = {
        id: uniqueId,
        type,
        message,
        timestamp: Date.now(),
        metadata,
        source: 'bot'
      };

      // Log to console for debugging
      console.log(`[Bot] ${type.toUpperCase()}: ${message}`, metadata || '');

      // Keep only the last 1000 logs to prevent memory issues
      const updatedLogs = [...prevLogs, newLog];
      if (updatedLogs.length > 1000) {
        return updatedLogs.slice(-1000);
      }
      return updatedLogs;
    });
  }, []);

  const initializeBot = useCallback((service: SolanaDexService) => {
    console.log('[Bot] Initializing bot with service');
    serviceRef.current = service;
    service.setLogCallback(addLog);
    addLog('info', 'Bot initialized with Solana DEX service');
  }, [addLog]);

  const setSelectedPair = useCallback((pair: SelectedPair | null) => {
    console.log('[Bot] Setting selected pair:', pair ? {
      fromToken: pair.fromToken.symbol,
      toToken: pair.toToken.symbol,
      poolIds: pair.allPoolIds
    } : 'null');
    
    selectedPairRef.current = pair;
    
    if (pair) {
      addLog('info', `Selected pair: ${pair.fromToken.symbol}/${pair.toToken.symbol}`, {
        fromToken: {
          symbol: pair.fromToken.symbol,
          address: pair.fromToken.address
        },
        toToken: {
          symbol: pair.toToken.symbol,
          address: pair.toToken.address
        },
        poolIds: pair.allPoolIds
      });
    }
  }, [addLog]);

  const checkArbitrageOpportunities = useCallback(async () => {
    console.log('[Bot] checkArbitrageOpportunities called:', {
      hasSelectedPair: !!selectedPairRef.current,
      hasService: !!serviceRef.current,
      isRunning,
      selectedPair: selectedPairRef.current ? {
        fromToken: selectedPairRef.current.fromToken.symbol,
        toToken: selectedPairRef.current.toToken.symbol,
        poolIds: selectedPairRef.current.allPoolIds
      } : null,
      service: serviceRef.current ? 'initialized' : 'not initialized'
    });

    if (!selectedPairRef.current || !serviceRef.current || !isRunning) {
      console.log('[Bot] Skipping opportunity check:', {
        hasSelectedPair: !!selectedPairRef.current,
        hasService: !!serviceRef.current,
        isRunning
      });
      return;
    }

    try {
      const selectedPair = selectedPairRef.current;
      const service = serviceRef.current;
      
      console.log('[Bot] Starting opportunity check:', {
        pair: `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`,
        fromToken: selectedPair.fromToken,
        toToken: selectedPair.toToken,
        poolIds: selectedPair.allPoolIds,
        serviceInitialized: !!service
      });

      // Get all pools for the pair first
      console.log('[Bot] Calling getPoolsForPair...');
      const pools = await service.getPoolsForPair(selectedPair.fromToken, selectedPair.toToken);
      console.log('[Bot] getPoolsForPair returned:', pools?.length || 0, 'pools');

      if (!pools || pools.length === 0) {
        console.log('[Bot] No pools found');
        addLog('info', 'No pools found');
        return;
      }

      console.log('[Bot] Got pools:', {
        count: pools.length,
        pools: pools.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price.toString(),
          tvl: p.tvl.toString()
        }))
      });

      // Find arbitrage opportunities
      console.log('[Bot] Finding arbitrage opportunities...');
      const opportunities = await service.findArbitrageOpportunities(
        selectedPair.fromToken,
        selectedPair.toToken,
        new Big(0.1) // Start with a small test amount
      );

      if (opportunities.length > 0) {
        console.log('[Bot] Found opportunities:', opportunities.map(opp => ({
          buyPool: {
            name: opp.buyPool.name,
            price: opp.buyPool.price.toString()
          },
          sellPool: {
            name: opp.sellPool.name,
            price: opp.sellPool.price.toString()
          },
          profit: opp.profitPercent.toString() + '%'
        })));

        opportunities.forEach((opp, index) => {
          addLog('success', `Found opportunity ${index + 1}/${opportunities.length}`, {
            buyPool: {
              name: opp.buyPool.name,
              price: opp.buyPool.price.toString(),
              tvl: opp.buyPool.tvl.toString(),
              volume24h: opp.buyPool.volume24h.toString()
            },
            sellPool: {
              name: opp.sellPool.name,
              price: opp.sellPool.price.toString(),
              tvl: opp.sellPool.tvl.toString(),
              volume24h: opp.sellPool.volume24h.toString()
            },
            metrics: {
              profit: opp.profitPercent.toFixed(2) + '%',
              confidence: (opp.confidence * 100).toFixed(1) + '%'
            }
          });
        });
      } else {
        console.log('[Bot] No profitable opportunities found');
        addLog('info', 'No profitable opportunities found');
      }

    } catch (error) {
      if (!isRunning) {
        console.log('[Bot] Error ignored because bot is stopping');
        return;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Bot] Error checking opportunities:', errorMessage, error);
      addLog('error', `Error checking opportunities: ${errorMessage}`);
      setError(errorMessage);
    }
  }, [selectedPairRef, serviceRef, isRunning, addLog]);

  const startBot = useCallback(async () => {
    if (!selectedPairRef.current || !serviceRef.current || isRunning) {
      console.error('[Bot] Cannot start bot:', {
        hasSelectedPair: !!selectedPairRef.current,
        hasService: !!serviceRef.current,
        isRunning
      });
      return;
    }

    try {
      const selectedPair = selectedPairRef.current;
      
      // Validate token info
      if (!selectedPair.fromToken || !selectedPair.toToken) {
        throw new Error('Invalid token pair selected');
      }

      // Validate pool IDs
      if (!selectedPair.allPoolIds || selectedPair.allPoolIds.length === 0) {
        throw new Error('No pool IDs found for selected pair');
      }

      console.log('[Bot] Starting bot with configuration:', {
        pair: `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`,
        fromToken: selectedPair.fromToken,
        toToken: selectedPair.toToken,
        poolIds: selectedPair.allPoolIds,
        checkInterval: BOT_CHECK_INTERVAL
      });

      addLog('info', `Starting bot with configuration:`, {
        pair: `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`,
        fromToken: {
          symbol: selectedPair.fromToken.symbol,
          address: selectedPair.fromToken.address
        },
        toToken: {
          symbol: selectedPair.toToken.symbol,
          address: selectedPair.toToken.address
        },
        poolIds: selectedPair.allPoolIds,
        checkInterval: BOT_CHECK_INTERVAL
      });

      // Set the pool IDs for the selected pair
      console.log('[Bot] Setting pool IDs:', selectedPair.allPoolIds);
      serviceRef.current.setSelectedPairPoolIds(selectedPair.allPoolIds);

      // Important: Set running state before starting checks
      setIsRunning(true);
      setError(null);

      // Start the opportunity checking loop
      console.log('[Bot] Starting first opportunity check');
      try {
        await checkArbitrageOpportunities();
        console.log('[Bot] First opportunity check completed');
      } catch (error) {
        console.error('[Bot] Error in first opportunity check:', error);
        setIsRunning(false); // Make sure to set running to false if first check fails
        throw error;
      }

      // Set up interval for continuous checking
      console.log('[Bot] Setting up interval check every', BOT_CHECK_INTERVAL, 'ms');
      intervalRef.current = setInterval(checkArbitrageOpportunities, BOT_CHECK_INTERVAL);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Bot] Failed to start bot:', errorMessage);
      addLog('error', `Failed to start bot: ${errorMessage}`);
      setError(errorMessage);
      setIsRunning(false);
    }
  }, [selectedPairRef, serviceRef, isRunning, addLog, checkArbitrageOpportunities]);

  const stopBot = useCallback(() => {
    console.log('[Bot] Stopping bot');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setError(null);
    addLog('info', 'Bot stopped');
  }, [addLog]);

  return {
    isRunning,
    error,
    logs,
    startBot,
    stopBot,
    initializeBot,
    setSelectedPair,
  };
};

export default useBot;
