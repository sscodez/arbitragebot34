import { Connection, PublicKey } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { Market } from '@raydium-io/raydium-sdk';
import { PriceMath} from '@orca-so/whirlpools-sdk';
import { BN } from '@project-serum/anchor';
import Decimal from 'decimal.js';
import { fetchSplashPool, setWhirlpoolsConfig } from '@orca-so/whirlpools';
export interface ArbitrageOpportunity {
  profitPercent: number;
  route: string;
  buyDex: string;
  sellDex: string;
  buyPrice: number;
  sellPrice: number;
}

export class SolanaDexService {
  private connection: Connection;
  private wallet: WalletContextState;
  private lastRequestTime: number = 0;
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  private initialized = false;

  constructor(connection: Connection, wallet: WalletContextState) {
    this.connection = connection;
    this.wallet = wallet;
    // Initialize Whirlpools config
    setWhirlpoolsConfig(this.connection.rpcEndpoint.includes('devnet') ? 'solanaDevnet' : 'solanaProd');
  }

  private async getRaydiumPrice(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<number> {
    try {
      const market = await Market.load(
        this.connection,
        new PublicKey(fromTokenAddress),
        new PublicKey(toTokenAddress),
        {},
        Market.getProgramId(3)
      );

      const price = await market.getPrice();

      console.log('[SolanaDexService] Raydium price calculated:', price);
      return price;
    } catch (error) {
      console.error('[SolanaDexService] Failed to get Raydium price:', error);
      return 0;
    }
  }

  private async getWhirlpoolPrice(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string
  ): Promise<number> {
    try {
      // Fetch pool info using the new method
      const poolInfo = await fetchSplashPool(
        this.connection,
        new PublicKey(fromTokenAddress),
        new PublicKey(toTokenAddress)
      );

      if (!poolInfo.initialized) {
        console.log('[SolanaDexService] Whirlpool not initialized for pair:', {
          fromToken: fromTokenAddress,
          toToken: toTokenAddress,
          poolInfo
        });
        return 0;
      }

      // Calculate the price from the sqrt price
      const price = PriceMath.sqrtPriceX64ToPrice(
        poolInfo.sqrtPrice,
        poolInfo.tokenMintA,
        poolInfo.tokenMintB
      );

      console.log('[SolanaDexService] Whirlpool price calculated:', {
        fromToken: fromTokenAddress,
        toToken: toTokenAddress,
        price: price.toString(),
        liquidity: poolInfo.liquidity.toString(),
        tickSpacing: poolInfo.tickSpacing
      });

      return price.toNumber();
    } catch (error) {
      console.error('[SolanaDexService] Failed to get Whirlpool price:', error);
      return 0;
    }
  }

  async findArbitrageOpportunities(
    fromTokenAddress: string,
    toTokenAddress: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const amount = '100000000'; // 0.1 SOL

      // Get prices from different DEXes
      const [raydiumPrice, whirlpoolPrice] = await Promise.all([
        this.getRaydiumPrice(fromTokenAddress, toTokenAddress, amount),
        this.getWhirlpoolPrice(fromTokenAddress, toTokenAddress, amount)
      ]);

      console.log('[SolanaDexService] Fetched prices:', {
        raydium: raydiumPrice,
        whirlpool: whirlpoolPrice,
        fromToken: fromTokenAddress,
        toToken: toTokenAddress
      });

      const opportunities: ArbitrageOpportunity[] = [];

      // Check Raydium -> Whirlpool
      if (raydiumPrice && whirlpoolPrice) {
        const profitPercent = ((whirlpoolPrice / raydiumPrice) * 100) - 100;
        if (profitPercent >= minProfitPercent) {
          opportunities.push({
            profitPercent,
            route: 'Raydium → Whirlpool',
            buyDex: 'Raydium',
            sellDex: 'Whirlpool',
            buyPrice: raydiumPrice,
            sellPrice: whirlpoolPrice
          });
        }

        // Check Whirlpool -> Raydium
        const reverseProfitPercent = ((raydiumPrice / whirlpoolPrice) * 100) - 100;
        if (reverseProfitPercent >= minProfitPercent) {
          opportunities.push({
            profitPercent: reverseProfitPercent,
            route: 'Whirlpool → Raydium',
            buyDex: 'Whirlpool',
            sellDex: 'Raydium',
            buyPrice: whirlpoolPrice,
            sellPrice: raydiumPrice
          });
        }
      }

      return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
    } catch (error) {
      console.error('[SolanaDexService] Failed to find opportunities:', {
        error: error instanceof Error ? error.message : 'Failed to fetch',
        details: error
      });
      throw error;
    }
  }

  async initialize(): Promise<void> {
    console.log('[SolanaDexService] Starting initialization');
    
    if (!this.wallet.connected) {
      console.error('[SolanaDexService] Wallet not connected');
      throw new Error('Wallet not connected');
    }

    if (!this.wallet.publicKey) {
      console.error('[SolanaDexService] No public key found');
      throw new Error('Wallet public key not found');
    }

    try {
      console.log('[SolanaDexService] Testing connection with wallet:', this.wallet.publicKey.toString());
      
      // Test connection with retries
      let balance = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          balance = await this.connection.getBalance(this.wallet.publicKey);
          break;
        } catch (err) {
          attempts++;
          if (attempts === maxAttempts) {
            throw err;
          }
          console.log(`[SolanaDexService] Retry ${attempts} of ${maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('[SolanaDexService] Connected successfully. Balance:', balance / 1e9, 'SOL');
      
      this.initialized = true;
      console.log('[SolanaDexService] Initialization complete');
    } catch (err) {
      console.error('[SolanaDexService] Initialization failed:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        details: err,
        wallet: {
          connected: this.wallet.connected,
          publicKey: this.wallet.publicKey?.toString(),
          adapter: this.wallet.adapter?.name
        },
        connection: {
          endpoint: this.connection.rpcEndpoint,
          commitment: this.connection.commitment
        }
      });
      throw err;
    }
  }

  async getTokenInfo(tokenAddress: string, symbol: string): Promise<{ address: string; symbol: string; decimals: number; name: string }> {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }

    try {
      console.log('[SolanaDexService] Getting token info:', { tokenAddress, symbol });
      const tokenMint = new PublicKey(tokenAddress);
      const tokenInfo = await this.connection.getParsedAccountInfo(tokenMint);
      
      if (!tokenInfo.value?.data || typeof tokenInfo.value.data !== 'object') {
        throw new Error(`Token ${symbol} not found`);
      }

      const { decimals } = (tokenInfo.value.data as any).parsed.info;

      return {
        address: tokenAddress,
        symbol,
        decimals,
        name: symbol
      };
    } catch (err) {
      console.error('[SolanaDexService] Failed to get token info:', err);
      throw err;
    }
  }

  async executeArbitrage(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    buyOnFirstDex: boolean
  ): Promise<void> {
    if (!this.initialized) {
      throw new Error('Service not initialized');
    }

    try {
      console.log('[SolanaDexService] Executing arbitrage:', {
        tokenA: tokenAAddress,
        tokenB: tokenBAddress,
        amount,
        buyOnFirstDex
      });

      // Mock successful execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('[SolanaDexService] Arbitrage executed successfully');
    } catch (err) {
      console.error('[SolanaDexService] Failed to execute arbitrage:', err);
      throw err;
    }
  }
}
