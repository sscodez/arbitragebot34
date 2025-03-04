import { Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { SolanaDexService } from './solanaDexService';
import { BaseService } from './baseService';
import { ArbitrageOpportunity } from '@/types/app';

export class ArbitrageService extends BaseService {
  private dexService: SolanaDexService;
  private initialized = false;
  private isRunning = false;
  private readonly FLOW_INTERVAL = 180000; // 3 minutes in milliseconds

  constructor(connection: Connection, wallet: WalletContextState) {
    super();
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
      // throw err;
    }
  }

  async startArbitrageFlow(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    minProfitPercent: number
  ): Promise<void> {
    if (!this.initialized) {
      // throw new Error('Service not initialized');
    }

    this.isRunning = true;

    while (this.isRunning && !this.isShuttingDown) {
      try {
        // Step 1: Get pools data
        this.log('info', 'Fetching pools data...', {
          tokenA: symbolA,
          tokenB: symbolB
        });
        const pools = await this.dexService.getPoolsForPair(tokenAAddress, tokenBAddress);

        // Step 2: Find opportunities
        this.log('info', 'Searching for arbitrage opportunities...');
        const opportunities = await this.findArbitrageOpportunities(
          tokenAAddress,
          tokenBAddress,
          minProfitPercent
        );

        // Step 3: Execute trade if opportunity exists
        if (opportunities.length > 0) {
          const bestOpportunity = opportunities[0];
          this.log('success', 'Found arbitrage opportunity', {
            profitPercent: bestOpportunity.profitPercent,
            route: bestOpportunity.route
          });

          await this.executeArbitrage(
            tokenAAddress,
            tokenBAddress,
            amount,
            symbolA,
            symbolB,
            bestOpportunity.buyDex === 'Jupiter'
          );
        } else {
          this.log('info', 'No profitable opportunities found');
        }

        // Wait for 3 minutes before next iteration
        this.log('info', 'Waiting for 3 minutes before next cycle...');
        await this.sleep(this.FLOW_INTERVAL);
      } catch (error) {
        this.log('error', 'Error in arbitrage flow', { error });
        // Still wait 3 minutes before retry even if there was an error
        await this.sleep(this.FLOW_INTERVAL);
      }
    }
  }

  stopArbitrageFlow(): void {
    this.log('info', 'Stopping arbitrage flow');
    this.isRunning = false;
  }

  async findArbitrageOpportunities(
    tokenAAddress: string,
    tokenBAddress: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    if (!this.initialized) {
      console.error('[ArbitrageService] Cannot find opportunities, service not initialized');
      // throw new Error('Service not initialized');
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
      // throw err;
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
      // throw new Error('Service not initialized');
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
      // throw err;
    }
  }

  shutdown() {
    super.shutdown();
    this.stopArbitrageFlow();
    this.dexService.shutdown();
  }
}
