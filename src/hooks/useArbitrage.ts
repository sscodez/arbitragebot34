import { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { ArbitrageService } from '../services/ArbitrageService';

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

interface UseArbitrageProps {
  onLog?: (type: 'info' | 'success' | 'error', message: string, metadata?: any) => void;
}

export const useArbitrage = ({ onLog }: UseArbitrageProps = {}) => {
  const [arbitrageService, setArbitrageService] = useState<ArbitrageService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const addLog = useCallback((type: 'info' | 'success' | 'error', message: string, metadata?: any) => {
    console.log(`[useArbitrage] ${type}:`, message, metadata || '');
    onLog?.(type, message, {
      ...metadata,
      source: 'arbitrage'
    });
  }, [onLog]);

  const wallet = useWallet();
  const { connection } = useConnection();

  // Initialize arbitrage service
  useEffect(() => {
    const init = async () => {
      // addLog('info', 'Checking initialization state', {
      //   wallet: {
      //     connected: wallet.connected,
      //     publicKey: wallet.publicKey?.toString(),
      //     adapter: wallet.adapter?.name
      //   },
      //   connection: connection ? {
      //     endpoint: connection.rpcEndpoint,
      //     commitment: connection.commitment
      //   } : null,
      //   arbitrageService: arbitrageService ? {
      //     initialized: arbitrageService.isInitialized
      //   } : null
      // });

      if (!wallet.connected || !wallet.publicKey || !connection) {
        addLog('info', 'Cannot initialize, missing dependencies');
        return;
      }

      try {
        // addLog('info', 'Starting initialization');
        
        if (!arbitrageService) {
          addLog('info', 'Creating new arbitrage service');
          const newService = new ArbitrageService(connection, wallet);
          setArbitrageService(newService);
          return; // Wait for next effect cycle
        }

        if (!arbitrageService.isInitialized) {
          addLog('info', 'Initializing arbitrage service');
          await arbitrageService.initialize();
          setIsInitialized(true);
          addLog('success', 'Initialization complete');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize arbitrage service';
        addLog('error', 'Initialization failed', {
          error: errorMsg,
          details: err
        });
        setError(errorMsg);
        setIsInitialized(false);
      }
    };

    init();
  }, [wallet.connected, wallet.publicKey, connection, arbitrageService, addLog]);

  const findOpportunities = useCallback(
    async (
      tokenAAddress: string,
      tokenBAddress: string,
      minProfitPercent: number
    ): Promise<ArbitrageOpportunity[]> => {
      addLog('info', 'Finding opportunities', {
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
        minProfitPercent,
        isInitialized,
        arbitrageService: arbitrageService ? {
          initialized: arbitrageService.isInitialized
        } : null
      });

      if (!isInitialized || !arbitrageService) {
        addLog('error', 'Cannot find opportunities, service not initialized', {
          isInitialized,
          hasService: !!arbitrageService,
          wallet: {
            connected: wallet.connected,
            publicKey: wallet.publicKey?.toString(),
            adapter: wallet.adapter?.name
          },
          connection: connection ? {
            endpoint: connection.rpcEndpoint,
            commitment: connection.commitment
          } : null
        });
        throw new Error('Arbitrage service not initialized');
      }

      try {
        setIsSearching(true);
        setError(null);

        const opportunities = await arbitrageService.findArbitrageOpportunities(
          tokenAAddress,
          tokenBAddress,
          minProfitPercent
        );

        addLog('success', 'Search completed', {
          foundOpportunities: opportunities.length,
          firstOpportunity: opportunities[0] ? {
            profitPercent: opportunities[0].profitPercent,
            route: opportunities[0].route
          } : null
        });

        setOpportunities(opportunities);
        return opportunities;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to find arbitrage opportunities';
        addLog('error', 'Error finding opportunities', {
          error: errorMsg,
          details: err,
          state: {
            isInitialized,
            wallet: {
              connected: wallet.connected,
              publicKey: wallet.publicKey?.toString()
            }
          }
        });
        setError(errorMsg);
        throw err;
      } finally {
        setIsSearching(false);
      }
    },
    [isInitialized, arbitrageService, wallet, connection, addLog]
  );

  const executeArbitrage = useCallback(
    async (
      tokenAAddress: string,
      tokenBAddress: string,
      amount: string,
      symbolA: string,
      symbolB: string,
      route: string
    ): Promise<void> => {
      if (!isInitialized || !arbitrageService) {
        throw new Error('Service not initialized');
      }

      try {
        await arbitrageService.executeArbitrage(
          tokenAAddress,
          tokenBAddress,
          amount,
          symbolA,
          symbolB,
          true
        );
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute arbitrage';
        setError(errorMsg);
        throw err;
      }
    },
    [isInitialized, arbitrageService]
  );

  return {
    findOpportunities,
    executeArbitrage,
    opportunities,
    isSearching,
    error,
    isInitialized
  };
};
