// import { BscDexService } from './bscDexService';
// import { EthDexService } from './ethDexService';
import { SolanaDexService } from './solanaDexService';
import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { SolanaEndpoints } from '@/constant/solana';
// import { providers } from 'ethers';

export type ChainType = 'SOLANA' | 'BSC' | 'ETH';

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface ArbitrageOpportunity {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  profitPercent: number;
  buyDex: string;
  sellDex: string;
  route: string;
}

interface Log {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: number;
  metadata?: any;
}

export class ArbitrageService {
  private dexService: SolanaDexService;
  private initialized = false;

  constructor(connection: Connection, wallet: WalletContextState) {
    console.log('[ArbitrageService] Constructing with:', {
      endpoint: connection.rpcEndpoint,
      commitment: connection.commitment,
      wallet: {
        connected: wallet.connected,
        publicKey: wallet.publicKey?.toString(),
        adapter: wallet.adapter?.name
      }
    });

    this.dexService = new SolanaDexService(connection, wallet);
  }

  get isInitialized(): boolean {
    return this.initialized;
  }

  async initialize(): Promise<void> {
    console.log('[ArbitrageService] Starting initialization');

    try {
      await this.dexService.initialize();
      this.initialized = true;
      console.log('[ArbitrageService] Initialization complete');
    } catch (err) {
      console.error('[ArbitrageService] Initialization failed:', err);
      this.initialized = false;
      throw err;
    }
  }

  async findArbitrageOpportunities(
    tokenAAddress: string,
    tokenBAddress: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    if (!this.initialized) {
      console.error('[ArbitrageService] Cannot find opportunities, service not initialized');
      throw new Error('Service not initialized');
    }

    try {
      console.log('[ArbitrageService] Finding arbitrage opportunities:', {
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
        minProfit: minProfitPercent
      });

      const opportunities = await this.dexService.findArbitrageOpportunities(
        tokenAAddress,
        tokenBAddress,
        minProfitPercent
      );

      console.log('[ArbitrageService] Found opportunities:', {
        count: opportunities.length,
        first: opportunities[0] ? {
          profitPercent: opportunities[0].profitPercent,
          route: opportunities[0].route
        } : null
      });

      return opportunities;
    } catch (err) {
      console.error('[ArbitrageService] Failed to find opportunities:', err);
      throw err;
    }
  }

  async executeArbitrage(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    buyOnFirstDex: boolean
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }

    try {
      console.log('[ArbitrageService] Executing arbitrage:', {
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
        amount,
        symbolA,
        symbolB,
        buyOnFirstDex
      });

      await this.dexService.executeArbitrage(
        tokenAAddress,
        tokenBAddress,
        amount,
        buyOnFirstDex
      );

      console.log('[ArbitrageService] Arbitrage executed successfully');
    } catch (err) {
      console.error('[ArbitrageService] Failed to execute arbitrage:', err);
      throw err;
    }
  }
}
