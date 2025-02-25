import { useState, useEffect, useCallback } from 'react';
import { ArbitrageService } from '../services/ArbitrageService';
import { useWallet } from './useWallet';

interface ArbitrageOpportunity {
  tokenA: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  tokenB: {
    address: string;
    symbol: string;
    decimals: number;
    name: string;
  };
  profitPercent: number;
  buyDex: string;
  sellDex: string;
  route: string;
}

export const useArbitrage = () => {
  const [arbitrageService] = useState(() => new ArbitrageService());
  const [isInitialized, setIsInitialized] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { provider, wallet, selectedChain, isConnected } = useWallet();

  useEffect(() => {
    const initService = async () => {
      if (provider && wallet && isConnected) {
        try {
          await arbitrageService.initialize(selectedChain, provider, wallet);
          setIsInitialized(true);
          setError(null);
        } catch (err: any) {
          setError(err.message);
          setIsInitialized(false);
        }
      } else {
        setIsInitialized(false);
      }
    };

    initService();
  }, [provider, wallet, selectedChain, isConnected]);

  const findOpportunities = useCallback(async (
    tokenAAddress: string,
    tokenBAddress: string,
    symbolA: string,
    symbolB: string,
    minProfitPercent: number
  ) => {
    if (!isInitialized) {
      throw new Error('Service not initialized');
    }

    setIsSearching(true);
    setError(null);

    try {
      const results = await arbitrageService.findArbitrageOpportunities(
        tokenAAddress,
        tokenBAddress,
        symbolA,
        symbolB,
        minProfitPercent
      );
      setOpportunities(results || []);
      return results;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, [isInitialized]);

  const executeArbitrage = useCallback(async (
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    buyOnFirstDex: boolean,
    slippageTolerance?: number
  ) => {
    if (!isInitialized) {
      throw new Error('Service not initialized');
    }

    setError(null);

    try {
      return await arbitrageService.executeArbitrage(
        tokenAAddress,
        tokenBAddress,
        amount,
        symbolA,
        symbolB,
        buyOnFirstDex,
        slippageTolerance
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  const getTokenInfo = useCallback(async (
    tokenAddress: string,
    symbol: string
  ) => {
    if (!isInitialized) {
      throw new Error('Service not initialized');
    }

    try {
      return await arbitrageService.getTokenInfo(tokenAddress, symbol);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [isInitialized]);

  return {
    findOpportunities,
    executeArbitrage,
    getTokenInfo,
    opportunities,
    isSearching,
    error,
    isInitialized,
    selectedChain
  };
};
