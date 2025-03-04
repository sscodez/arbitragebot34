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
    console.log('[Bot] initializeBot called:', {
      hasService: !!service
    });
    
    if (!service) {
      console.error('[Bot] Cannot initialize bot: service is null');
      return;
    }

    serviceRef.current = service;
    service.setLogCallback((type, message, metadata) => {
      console.log(`[Bot Service] ${type.toUpperCase()}: ${message}`, metadata || '');
      addLog(type, message, metadata);
    });
    
    console.log('[Bot] Bot initialized with Solana DEX service');
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
    if (!serviceRef.current) {
      console.error('[Bot] Cannot check opportunities: service not initialized');
      return;
    }

    try {
      console.log('[Bot] Checking arbitrage opportunities');
      const service = serviceRef.current;
      const selectedPair = selectedPairRef.current;
      
      if (!selectedPair) {
        console.error('[Bot] No pair selected');
        return;
      }

      // Get pools for the selected pair
      console.log('[Bot] Getting pools for pair:', {
        fromToken: selectedPair.fromToken.symbol,
        toToken: selectedPair.toToken.symbol
      });

      const pools = await service.getPoolsForPair(
        selectedPair.fromToken,
        selectedPair.toToken
      );

      console.log('[Bot] Retrieved pools:', pools.length);

      if (!pools || pools.length === 0) {
        console.log('[Bot] No pools found');
        return;
      }

      // Find arbitrage opportunities
      const opportunities = await service.findArbitrageOpportunities(
        selectedPair.fromToken,
        selectedPair.toToken,
        new Big(0.1) // Start with small test amount
      );

      if (opportunities && opportunities.length > 0) {
        console.log('[Bot] Found opportunities:', opportunities.length);
        opportunities.forEach(opp => {
          addLog('success', 'Found arbitrage opportunity', {
            buyPool: opp.buyPool.name,
            sellPool: opp.sellPool.name,
            profit: opp.profitPercent.toString() + '%'
          });
        });
      } else {
        console.log('[Bot] No opportunities found this round');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Bot] Error checking opportunities:', errorMessage);
      addLog('error', `Error checking opportunities: ${errorMessage}`);
      setError(errorMessage);
    }
  }, [addLog]);

  const startBot = useCallback(async () => {
    console.log('[Bot] startBot called');
    
    if (!serviceRef.current) {
      const error = 'Cannot start bot: service not initialized';
      console.error('[Bot]', error);
      addLog('error', error);
      return;
    }

    if (!selectedPairRef.current) {
      const error = 'Cannot start bot: no pair selected';
      console.error('[Bot]', error);
      addLog('error', error);
      return;
    }

    if (isRunning) {
      console.log('[Bot] Bot is already running');
      return;
    }

    try {
      const service = serviceRef.current;
      const selectedPair = selectedPairRef.current;

      console.log('[Bot] Starting with configuration:', {
        pair: `${selectedPair.fromToken.symbol}/${selectedPair.toToken.symbol}`,
        poolIds: selectedPair.allPoolIds
      });

      // Set pool IDs and start checking
      service.setSelectedPairPoolIds(selectedPair.allPoolIds);
      
      setIsRunning(true);
      setError(null);
      addLog('info', 'Bot started');

      // Do first check immediately
      await checkArbitrageOpportunities();
      
      // Set up interval for continuous checking
      if (!intervalRef.current) {
        console.log('[Bot] Setting up check interval:', BOT_CHECK_INTERVAL, 'ms');
        intervalRef.current = setInterval(checkArbitrageOpportunities, BOT_CHECK_INTERVAL);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Bot] Failed to start:', errorMessage);
      setIsRunning(false);
      setError(errorMessage);
      addLog('error', `Failed to start: ${errorMessage}`);
    }
  }, [isRunning, selectedPairRef, serviceRef, checkArbitrageOpportunities, addLog]);

  const stopBot = useCallback(() => {
    console.log('[Bot] Stopping bot');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRunning(false);
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
