import { BscDexService } from './bscDexService';
import { EthDexService } from './ethDexService';
import { SolanaDexService } from './solanaDexService';
import { Connection, Keypair } from '@solana/web3.js';
import { SolanaEndpoints } from '@/constant/solana';
import { providers } from 'ethers';

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
  private bscService: BscDexService | null = null;
  private ethService: EthDexService | null = null;
  private solanaService: SolanaDexService | null = null;
  private currentChain: ChainType | null = null;
  private logs: Log[] = [];
  private logCallback: ((log: Log) => void) | null = null;

  setLogCallback(callback: (log: Log) => void) {
    this.logCallback = callback;
  }

  addLog(log: Log) {
    this.logs.push(log);
    if (this.logCallback) {
      this.logCallback(log);
    }
  }

  async initialize(chain: ChainType, provider: any, wallet: any) {
    this.currentChain = chain;
    this.logs = [];

    this.addLog({
      type: 'info',
      message: `Initializing ${chain} service`,
      timestamp: Date.now()
    });

    switch (chain) {
      case 'BSC':
        if (provider instanceof providers.Web3Provider) {
          this.bscService = new BscDexService(provider, wallet, this.addLog.bind(this));
          this.addLog({
            type: 'success',
            message: 'BSC service initialized',
            timestamp: Date.now()
          });
        }
        break;
      case 'ETH':
        if (provider instanceof providers.Web3Provider) {
          this.ethService = new EthDexService(provider, this.addLog.bind(this));
          this.addLog({
            type: 'success',
            message: 'ETH service initialized',
            timestamp: Date.now()
          });
        }
        break;
      case 'SOLANA':
        if (provider instanceof Connection && wallet instanceof Keypair) {
          this.solanaService = new SolanaDexService(provider, wallet, this.addLog.bind(this));
          this.addLog({
            type: 'success',
            message: 'Solana service initialized',
            timestamp: Date.now()
          });
        }
        break;
      default:
        throw new Error('Unsupported chain');
    }
  }

  private getCurrentService() {
    switch (this.currentChain) {
      case 'BSC':
        return this.bscService;
      case 'ETH':
        return this.ethService;
      case 'SOLANA':
        return this.solanaService;
      default:
        throw new Error('No chain selected');
    }
  }

  async getTokenInfo(tokenAddress: string, symbol: string): Promise<TokenInfo> {
    const service = this.getCurrentService();
    if (!service) {
      throw new Error('Service not initialized');
    }
    return service.getTokenInfo(tokenAddress, symbol);
  }

  async findArbitrageOpportunities(
    tokenAAddress: string,
    tokenBAddress: string,
    symbolA: string,
    symbolB: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    const service = this.getCurrentService();
    if (!service) {
      this.addLog({
        type: 'error',
        message: 'Service not initialized',
        timestamp: Date.now()
      });
      throw new Error('Service not initialized');
    }

    this.addLog({
      type: 'info',
      message: `Searching for opportunities: ${symbolA}/${symbolB}`,
      timestamp: Date.now(),
      metadata: {
        pair: `${symbolA}/${symbolB}`,
        chain: this.currentChain
      }
    });

    try {
      const opportunities = await service.findArbitrageOpportunities(
        tokenAAddress,
        tokenBAddress,
        symbolA,
        symbolB,
        minProfitPercent
      );

      if (opportunities.length > 0) {
        opportunities.forEach(opp => {
          this.addLog({
            type: 'success',
            message: `Found arbitrage opportunity for ${symbolA}/${symbolB}`,
            timestamp: Date.now(),
            metadata: {
              pair: `${symbolA}/${symbolB}`,
              profitPercent: opp.profitPercent.toFixed(2) + '%',
              route: opp.route,
              buyDex: opp.buyDex,
              sellDex: opp.sellDex
            }
          });
        });
      } else {
        this.addLog({
          type: 'info',
          message: `No profitable opportunities found for ${symbolA}/${symbolB}`,
          timestamp: Date.now(),
          metadata: {
            pair: `${symbolA}/${symbolB}`,
            minProfitPercent: minProfitPercent + '%'
          }
        });
      }

      return opportunities;
    } catch (error: any) {
      this.addLog({
        type: 'error',
        message: `Error finding opportunities: ${error.message}`,
        timestamp: Date.now(),
        metadata: {
          pair: `${symbolA}/${symbolB}`,
          error: error.message
        }
      });
      throw error;
    }
  }

  async executeArbitrage(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    buyOnFirstDex: boolean,
    slippageTolerance?: number
  ): Promise<string> {
    const service = this.getCurrentService();
    if (!service) {
      throw new Error('Service not initialized');
    }
    return service.executeArbitrage(
      tokenAAddress,
      tokenBAddress,
      amount,
      symbolA,
      symbolB,
      buyOnFirstDex,
      slippageTolerance
    );
  }

  async getPrices(tokenA: TokenInfo, tokenB: TokenInfo) {
    const service = this.getCurrentService();
    if (!service) {
      throw new Error('Service not initialized');
    }
    return service.getPrices(tokenA, tokenB);
  }

  getDefaultProvider(chain: ChainType): any {
    switch (chain) {
      case 'SOLANA':
        return new Connection(SolanaEndpoints.mainnet.http, {
          wsEndpoint: SolanaEndpoints.mainnet.ws,
          commitment: 'confirmed'
        });
      case 'BSC':
      case 'ETH':
        return null; // These will be provided by the wallet
      default:
        throw new Error('Unsupported chain');
    }
  }
}
