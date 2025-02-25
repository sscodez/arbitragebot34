import { useState, useCallback, useEffect } from 'react';
import { useArbitrage } from './useArbitrage';
import { useWallet } from './useWallet';

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

export const useBot = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPair, setSelectedPair] = useState<SelectedPair | null>(null);
  const [minProfitPercent, setMinProfitPercent] = useState(1); // 1%
  const [lastOpportunity, setLastOpportunity] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInterval, setSearchInterval] = useState<NodeJS.Timeout | null>(null);

  const { 
    findOpportunities, 
    executeArbitrage, 
    opportunities, 
    isSearching,
    error: arbitrageError,
    isInitialized 
  } = useArbitrage();

  const { isConnected } = useWallet();

  const startBot = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isInitialized) {
      setError('Arbitrage service not initialized');
      return;
    }

    if (!selectedPair) {
      setError('Please select a token pair first');
      return;
    }

    setIsRunning(true);
    setError(null);
  }, [selectedPair, isConnected, isInitialized]);

  const stopBot = useCallback(() => {
    setIsRunning(false);
    setLastOpportunity(null);
    if (searchInterval) {
      clearInterval(searchInterval);
      setSearchInterval(null);
    }
  }, [searchInterval]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const searchForOpportunities = async () => {
      if (!isRunning || !selectedPair) return;

      try {
        const { fromToken, toToken } = selectedPair;
        const results = await findOpportunities(
          fromToken.address,
          toToken.address,
          fromToken.symbol,
          toToken.symbol,
          minProfitPercent
        );

        if (results && results.length > 0) {
          setLastOpportunity(results[0]);
          
          // Auto-execute if profit is above threshold
          if (results[0].profitPercent >= minProfitPercent) {
            const buyOnFirstDex = results[0].buyDex === results[0].dexes[0];
            await executeArbitrage(
              fromToken.address,
              toToken.address,
              '1', // Amount in base units
              fromToken.symbol,
              toToken.symbol,
              buyOnFirstDex
            );
          }
        }
      } catch (err: any) {
        setError(err.message);
        setIsRunning(false);
      }
    };

    if (isRunning) {
      // Initial search
      searchForOpportunities();
      // Set up interval for continuous searching
      intervalId = setInterval(searchForOpportunities, 10000); // Every 10 seconds
      setSearchInterval(intervalId);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, selectedPair, minProfitPercent, findOpportunities, executeArbitrage]);

  useEffect(() => {
    if (arbitrageError) {
      setError(arbitrageError);
      setIsRunning(false);
    }
  }, [arbitrageError]);

  // Stop bot if wallet disconnects
  useEffect(() => {
    if (!isConnected && isRunning) {
      stopBot();
      setError('Wallet disconnected');
    }
  }, [isConnected, isRunning, stopBot]);

  return {
    isRunning,
    startBot,
    stopBot,
    setSelectedPair,
    setMinProfitPercent,
    lastOpportunity,
    opportunities,
    isSearching,
    error,
    selectedPair
  };
};
