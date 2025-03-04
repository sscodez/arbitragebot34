import { Connection } from '@solana/web3.js';
import { TokenInfo } from '@/types/token';
import { PoolInfo, RaydiumPoolResponse } from '@/types/pool';
import { RaydiumService } from './raydium';
import Big from 'big.js';
import { MINIMUM_LIQUIDITY_THRESHOLD, MINIMUM_PROFIT_THRESHOLD } from '@/config/constants';
import { BaseService } from './baseService';

interface ArbitrageOpportunity {
  buyPool: PoolInfo;
  sellPool: PoolInfo;
  price: Big;
  profit: Big;
  profitPercent: Big;
  confidence: number;
}

type LogCallback = (type: 'info' | 'success' | 'error', message: string, metadata?: any) => void;

export class SolanaDexService extends BaseService {
  private connection: Connection;
  private raydiumService: RaydiumService;

  constructor(connection: Connection) {
    super();
    console.log('[Bot] Initializing SolanaDexService');
    this.connection = connection;
    this.raydiumService = new RaydiumService();
    this.raydiumService.setLogCallback(this.log.bind(this));
  }

  setSelectedPairPoolIds(poolIds: string[]) {
    console.log('[SolanaDex] Setting selected pair pool IDs:', poolIds);
    if (!this.raydiumService) {
      console.error('[SolanaDex] Cannot set pool IDs: Raydium service not initialized');
      throw new Error('Raydium service not initialized');
    }
    this.raydiumService.setSelectedPairPoolIds(poolIds);
    console.log('[SolanaDex] Pool IDs set successfully');
  }

  async getPoolsForPair(tokenA: TokenInfo, tokenB: TokenInfo): Promise<PoolInfo[]> {
    if (this.isShuttingDown) return [];
    
    try {
      console.log('[SolanaDex] getPoolsForPair called:', {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        isShuttingDown: this.isShuttingDown,
        hasRaydiumService: !!this.raydiumService
      });

      this.log('info', `Getting pools for ${tokenA.symbol}/${tokenB.symbol}`, {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol
      });
      
      console.log('[SolanaDex] Calling Raydium getPoolsForPair...');
      const raydiumPools = await this.raydiumService.getPoolsForPair(tokenA, tokenB);
      console.log('[SolanaDex] Raydium returned', raydiumPools.length, 'pools');
      
      // Transform Raydium pools to PoolInfo
      console.log('[SolanaDex] Transforming pools...');
      const pools = raydiumPools.map(pool => this.transformRaydiumPool(pool, tokenA, tokenB));
      console.log('[SolanaDex] Transformed', pools.length, 'pools');
      
      if (!this.isShuttingDown) {
        if (pools.length > 0) {
          console.log('[SolanaDex] Transformed pools:', pools.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price.toString(),
            tvl: p.tvl.toString()
          })));

          this.log('success', `Found ${pools.length} pools for ${tokenA.symbol}/${tokenB.symbol}`, 
            pools.map(p => ({
              id: p.id,
              name: p.name,
              tvl: p.tvl.toString(),
              volume24h: p.volume24h.toString()
            }))
          );
        } else {
          console.log('[SolanaDex] No pools found for pair');
          this.log('info', `No pools found for ${tokenA.symbol}/${tokenB.symbol}`);
        }
      }
      
      return pools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[SolanaDex] Error getting pools:', {
        error: errorMessage,
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol
      });
      if (!this.isShuttingDown) {
        this.log('error', `Error getting pools: ${errorMessage}`);
        throw error;
      }
      return [];
    }
  }

  async getPools(): Promise<PoolInfo[]> {
    try {
      console.log('[SolanaDex] Getting pools');
      const raydiumPools = await this.raydiumService.getPools();
      return raydiumPools.map(pool => ({
        id: pool.id,
        name: pool.name || `${pool.mintA.symbol}/${pool.mintB.symbol}`,
        tokenA: {
          address: pool.mintA.address,
          symbol: pool.mintA.symbol,
          decimals: pool.mintA.decimals
        },
        tokenB: {
          address: pool.mintB.address,
          symbol: pool.mintB.symbol,
          decimals: pool.mintB.decimals
        },
        price: new Big(pool.price || '0'),
        tvl: new Big(pool.tvl || '0'),
        volume24h: new Big(pool.volume24h || '0'),
        fee: new Big(pool.feeRate || 0),
        dex: 'raydium'
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting pools: ${errorMessage}`);
      throw error;
    }
  }

  private transformRaydiumPool(pool: RaydiumPoolResponse, tokenA: TokenInfo, tokenB: TokenInfo): PoolInfo {
    const isTokenAMintA = pool.mintA.address.toLowerCase() === tokenA.address.toLowerCase();
    
    return {
      id: pool.id,
      name: pool.name || `${pool.mintA.symbol}/${pool.mintB.symbol}`,
      tokenA: isTokenAMintA ? {
        address: pool.mintA.address,
        symbol: pool.mintA.symbol,
        decimals: pool.mintA.decimals
      } : {
        address: pool.mintB.address,
        symbol: pool.mintB.symbol,
        decimals: pool.mintB.decimals
      },
      tokenB: isTokenAMintA ? {
        address: pool.mintB.address,
        symbol: pool.mintB.symbol,
        decimals: pool.mintB.decimals
      } : {
        address: pool.mintA.address,
        symbol: pool.mintA.symbol,
        decimals: pool.mintA.decimals
      },
      price: new Big(pool.price || '0'),
      tvl: new Big(pool.tvl || '0'),
      volume24h: new Big(pool.volume24h || '0'),
      fee: new Big(pool.feeRate || 0),
      dex: 'raydium'
    };
  }

  async getPriceFromPool(poolId: string): Promise<Big> {
    try {
      const price = await this.raydiumService.getPriceFromPool(poolId);
      this.log('info', `Got price from pool ${poolId}: ${price.toFixed(6)}`);
      return price;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting price from pool ${poolId}: ${errorMessage}`);
      throw error;
    }
  }

  async getLiquidityFromPool(poolId: string): Promise<Big> {
    try {
      const liquidity = await this.raydiumService.getLiquidityFromPool(poolId);
      this.log('info', `Got liquidity from pool ${poolId}: $${liquidity.toFixed(2)}`);
      return liquidity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting liquidity from pool ${poolId}: ${errorMessage}`);
      throw error;
    }
  }

  async findArbitrageOpportunities(
    tokenA: TokenInfo,
    tokenB: TokenInfo,
    amount: Big
  ): Promise<ArbitrageOpportunity[]> {
    if (this.isShuttingDown) return [];

    try {
      this.log('info', `Finding arbitrage opportunities for ${tokenA.symbol}/${tokenB.symbol}`, {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        amount: amount.toString()
      });

      // Get all valid pools for the token pair
      const pools = await this.getPoolsForPair(tokenA, tokenB);

      this.log('info', `Found ${pools.length} pools`, {
        pools: pools.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price.toString(),
          tvl: p.tvl.toString(),
          volume24h: p.volume24h.toString()
        }))
      });

      if (pools.length < 2) {
        this.log('info', 'Not enough pools for arbitrage');
        return [];
      }

      const opportunities: ArbitrageOpportunity[] = [];
      const validPools = pools.filter(pool => 
        pool.tvl.gt(MINIMUM_LIQUIDITY_THRESHOLD) &&
        pool.volume24h.gt(0)
      );

      this.log('info', `Found ${validPools.length} valid pools with sufficient liquidity`, {
        validPools: validPools.map(p => ({
          id: p.id,
          name: p.name,
          tvl: p.tvl.toString(),
          volume24h: p.volume24h.toString()
        }))
      });

      // Compare each pair of pools
      for (let i = 0; i < validPools.length; i++) {
        const poolA = validPools[i];
        
        for (let j = i + 1; j < validPools.length; j++) {
          const poolB = validPools[j];

          // Calculate price difference
          const priceA = poolA.price;
          const priceB = poolB.price;

          this.log('info', `Comparing pools: ${poolA.name} vs ${poolB.name}`, {
            poolA: {
              name: poolA.name,
              price: priceA.toString(),
              tvl: poolA.tvl.toString()
            },
            poolB: {
              name: poolB.name,
              price: priceB.toString(),
              tvl: poolB.tvl.toString()
            }
          });

          // Skip if prices are too close
          if (priceA.eq(priceB)) {
            this.log('info', 'Prices are equal, skipping');
            continue;
          }

          // Determine buy and sell pools
          let buyPool, sellPool;
          if (priceA.lt(priceB)) {
            buyPool = poolA;
            sellPool = poolB;
          } else {
            buyPool = poolB;
            sellPool = poolA;
          }

          // Calculate potential profit
          const buyAmount = amount;
          const sellAmount = buyAmount.mul(sellPool.price).div(buyPool.price);
          const profit = sellAmount.sub(buyAmount);
          const profitPercent = profit.div(buyAmount).mul(100);

          this.log('info', `Calculated profit for ${buyPool.name} -> ${sellPool.name}`, {
            buyPool: buyPool.name,
            sellPool: sellPool.name,
            buyPrice: buyPool.price.toString(),
            sellPrice: sellPool.price.toString(),
            profit: profit.toString(),
            profitPercent: profitPercent.toString()
          });

          // Only consider opportunities with profit above threshold
          if (profitPercent.gt(MINIMUM_PROFIT_THRESHOLD)) {
            const confidence = this.calculateConfidence(buyPool, sellPool, profitPercent);

            this.log('success', `Found profitable opportunity: ${buyPool.name} -> ${sellPool.name}`, {
              buyPool: {
                name: buyPool.name,
                price: buyPool.price.toString(),
                tvl: buyPool.tvl.toString()
              },
              sellPool: {
                name: sellPool.name,
                price: sellPool.price.toString(),
                tvl: sellPool.tvl.toString()
              },
              profit: profit.toString(),
              profitPercent: profitPercent.toString(),
              confidence
            });

            opportunities.push({
              buyPool,
              sellPool,
              price: sellPool.price.div(buyPool.price),
              profit,
              profitPercent,
              confidence
            });
          }
        }
      }

      return opportunities;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error finding arbitrage opportunities: ${errorMessage}`);
      throw error;
    }
  }

  private calculateConfidence(buyPool: any, sellPool: any, profitPercent: Big): number {
    // Base confidence starts at 0.8
    let confidence = 0.8;

    // Adjust based on TVL (higher TVL = higher confidence)
    const minTvl = Big.min(new Big(buyPool.tvl || '0'), new Big(sellPool.tvl || '0'));
    if (minTvl.gt(1000000)) { // > $1M TVL
      confidence += 0.1;
    } else if (minTvl.lt(100000)) { // < $100K TVL
      confidence -= 0.2;
    }

    // Adjust based on profit percent (higher profit = lower confidence)
    if (profitPercent.gt(5)) {
      confidence -= 0.2; // Very high profit might be suspicious
    } else if (profitPercent.gt(2)) {
      confidence -= 0.1;
    }

    // Adjust based on volume (higher volume = higher confidence)
    const minVolume = Big.min(
      new Big(buyPool.volume24h || 0), 
      new Big(sellPool.volume24h || 0)
    );
    if (minVolume.gt(500000)) { // > $500K daily volume
      confidence += 0.1;
    } else if (minVolume.lt(50000)) { // < $50K daily volume
      confidence -= 0.1;
    }

    // Ensure confidence stays between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  async shutdown() {
    super.shutdown();
    await this.raydiumService.shutdown();
  }

  setLogCallback(callback: LogCallback) {
    super.setLogCallback(callback);
    this.raydiumService.setLogCallback(callback);
  }

  private log(type: 'info' | 'success' | 'error', message: string, metadata?: any) {
    if (this.isShuttingDown) return;
    console.log(`[Bot] ${type.toUpperCase()}: ${message}`, metadata || '');
    this.logCallback?.(type, message, metadata);
  }
}
