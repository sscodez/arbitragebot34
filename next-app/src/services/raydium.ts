import { TokenInfo } from '@/types/token';
import { RaydiumPoolResponse, ApiPoolResponse } from '@/types/pool';
import { RAYDIUM_API_ENDPOINT } from '@/config/constants';
import axios from 'axios';
import Big from 'big.js';
import { BaseService } from './baseService';

export class RaydiumService extends BaseService {
  private selectedPairPoolIds: string[] = [];
  private poolCache: Map<string, RaydiumPoolResponse> = new Map();
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 60000; // 1 minute
  private readonly API_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private readonly BATCH_DELAY = 3000; // 3 seconds between batches
  private activeRequests: AbortController[] = [];

  constructor() {
    super();
    console.log('[Raydium] Initializing service');
  }

  async shutdown() {
    super.shutdown();
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests = [];
  }

  setSelectedPairPoolIds(poolIds: string[]) {
    console.log('[Raydium] Setting pool IDs:', poolIds);
    if (!poolIds || poolIds.length === 0) {
      console.error('[Raydium] Cannot set empty pool IDs');
      throw new Error('Cannot set empty pool IDs');
    }
    this.selectedPairPoolIds = poolIds;
    console.log('[Raydium] Pool IDs set successfully');

    // Clear the pool cache to force a refresh
    console.log('[Raydium] Clearing pool cache');
    this.poolCache.clear();
    this.lastCacheUpdate = 0;
  }

  private getAllConfiguredPoolIds(): string[] {
    try {
      const poolIds = this.selectedPairPoolIds;
      
      if (!poolIds || poolIds.length === 0) {
        console.error('[Raydium] No pool IDs configured');
        this.log('error', 'No pool IDs configured');
        return [];
      }

      console.log('[Raydium] Found configured pool IDs:', poolIds);
      this.log('info', `Found ${poolIds.length} configured pool IDs`, { poolIds });
      return poolIds;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Raydium] Error getting configured pool IDs:', errorMessage);
      this.log('error', `Error getting configured pool IDs: ${errorMessage}`);
      return [];
    }
  }

  async getPoolsForPair(tokenA: TokenInfo, tokenB: TokenInfo): Promise<RaydiumPoolResponse[]> {
    try {
      console.log('[Raydium] Starting getPoolsForPair:', {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol
      });

      // Get pool IDs from the selected pair
      const poolIds = this.getAllConfiguredPoolIds();
      console.log('[Raydium] Pool IDs for pair:', {
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol,
        poolIds
      });

      if (!poolIds || poolIds.length === 0) {
        console.error('[Raydium] No pool IDs found in configuration');
        throw new Error('No pool IDs found in configuration');
      }

      // Update pool cache
      console.log('[Raydium] Updating pool cache...');
      try {
        await this.updatePoolCache(poolIds);
        console.log('[Raydium] Pool cache updated successfully. Cache size:', this.poolCache.size);
      } catch (error) {
        console.error('[Raydium] Error updating pool cache:', error);
        throw error;
      }

      // Get all pools that match the token pair
      console.log('[Raydium] Filtering pools for token pair...');
      const pairPools = Array.from(this.poolCache.values()).filter(pool => {
        const matchesTokenA = 
          pool.mintA.address.toLowerCase() === tokenA.address.toLowerCase() || 
          pool.mintB.address.toLowerCase() === tokenA.address.toLowerCase();
        const matchesTokenB = 
          pool.mintA.address.toLowerCase() === tokenB.address.toLowerCase() || 
          pool.mintB.address.toLowerCase() === tokenB.address.toLowerCase();
        
        console.log('[Raydium] Checking pool match:', {
          poolId: pool.id,
          poolName: pool.name,
          matchesTokenA,
          matchesTokenB,
          tokenA: {
            address: tokenA.address,
            poolMintA: pool.mintA.address,
            poolMintB: pool.mintB.address
          },
          tokenB: {
            address: tokenB.address,
            poolMintA: pool.mintA.address,
            poolMintB: pool.mintB.address
          }
        });

        return matchesTokenA && matchesTokenB;
      });

      console.log('[Raydium] Found matching pools:', {
        totalPools: this.poolCache.size,
        matchingPools: pairPools.length,
        pools: pairPools.map(p => ({
          id: p.id,
          name: p.name,
          mintA: p.mintA.symbol,
          mintB: p.mintB.symbol,
          tokenAAmount: p.tokenAAmount,
          tokenBAmount: p.tokenBAmount
        }))
      });

      // Calculate prices for each pool
      console.log('[Raydium] Calculating prices for pools...');
      const poolsWithPrices = pairPools.map(pool => {
        let price: string;
        if (pool.mintA.address.toLowerCase() === tokenA.address.toLowerCase()) {
          // If tokenA is mintA, price is tokenB/tokenA
          price = new Big(pool.tokenBAmount).div(pool.tokenAAmount).toString();
          console.log('[Raydium] Calculated price for pool:', {
            poolId: pool.id,
            name: pool.name,
            tokenAAmount: pool.tokenAAmount,
            tokenBAmount: pool.tokenBAmount,
            price
          });
        } else {
          // If tokenA is mintB, price is tokenA/tokenB
          price = new Big(pool.tokenAAmount).div(pool.tokenBAmount).toString();
          console.log('[Raydium] Calculated price for pool:', {
            poolId: pool.id,
            name: pool.name,
            tokenAAmount: pool.tokenBAmount, // Swapped because tokenA is mintB
            tokenBAmount: pool.tokenAAmount, // Swapped because tokenB is mintA
            price
          });
        }

        return {
          ...pool,
          price
        };
      });

      console.log('[Raydium] Successfully completed getPoolsForPair:', {
        totalPools: this.poolCache.size,
        matchingPools: poolsWithPrices.length,
        pools: poolsWithPrices.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price
        }))
      });

      return poolsWithPrices;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Raydium] Error in getPoolsForPair:', {
        error: errorMessage,
        tokenA: tokenA.symbol,
        tokenB: tokenB.symbol
      });
      throw error;
    }
  }

  private async fetchPoolWithRetry(poolId: string, retries = 3): Promise<RaydiumPoolResponse | null> {
    try {
      this.log('info', `Fetching pool data for: ${poolId}`);
      const apiUrl = `${RAYDIUM_API_ENDPOINT}/pools/info/ids?ids=${poolId}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        this.log('error', `Failed to fetch pool data: ${response.statusText}`, {
          poolId,
          status: response.status,
          statusText: response.statusText
        });
        return null;
      }

      const data = await response.json();

      // Handle v3 API response format
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const poolData = data.data[0];
        
        if (!this.isValidPoolData(poolData)) {
          this.log('error', 'Invalid pool data received', {
            poolId,
            data: poolData
          });
          return null;
        }

        const transformedPool = {
          id: poolId,
          name: `${poolData.mintA.symbol}/${poolData.mintB.symbol}`,
          mintA: {
            address: poolData.mintA.address,
            symbol: poolData.mintA.symbol,
            decimals: poolData.mintA.decimals
          },
          mintB: {
            address: poolData.mintB.address,
            symbol: poolData.mintB.symbol,
            decimals: poolData.mintB.decimals
          },
          tokenAAmount: poolData.mintAmountA.toString(),
          tokenBAmount: poolData.mintAmountB.toString(),
          tvl: poolData.tvl.toString(),
          volume24h: poolData.day?.volume?.toString() || '0',
          price: poolData.price.toString(),
          feeRate: poolData.feeRate,
          type: poolData.type.toLowerCase()
        };

        this.log('success', 'Successfully fetched pool data', {
          id: transformedPool.id,
          name: transformedPool.name,
          price: transformedPool.price,
          tvl: transformedPool.tvl,
          volume24h: transformedPool.volume24h
        });

        return transformedPool;
      }

      this.log('error', 'No valid pool data found in response', {
        poolId,
        success: data.success,
        hasData: Array.isArray(data.data),
        dataLength: Array.isArray(data.data) ? data.data.length : 0
      });
      return null;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error fetching pool: ${errorMessage}`, {
        poolId,
        retriesLeft: retries
      });

      if (retries > 0) {
        this.log('info', `Retrying pool fetch (${retries} attempts remaining)`);
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        return this.fetchPoolWithRetry(poolId, retries - 1);
      }

      return null;
    }
  }

  private async updatePoolCache(poolIds: string[]) {
    try {
      this.log('info', `Starting pool cache update for ${poolIds.length} pools`);

      // Check if we need to update the cache
      const now = Date.now();
      const cacheAge = now - this.lastCacheUpdate;
      
      if (cacheAge < this.CACHE_TTL && this.poolCache.size > 0) {
        this.log('info', `Using cached pool data (age: ${cacheAge/1000}s)`);
        return;
      }

      // Process pools in batches
      const BATCH_SIZE = 3;
      const totalBatches = Math.ceil(poolIds.length / BATCH_SIZE);
      
      for (let i = 0; i < poolIds.length; i += BATCH_SIZE) {
        const batch = poolIds.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
        
        this.log('info', `Processing batch ${batchNumber}/${totalBatches}`);

        const batchPromises = batch.map(poolId => this.fetchPoolWithRetry(poolId));
        const batchResults = await Promise.all(batchPromises);

        // Filter out null results and add to cache
        batchResults.forEach((pool, index) => {
          if (pool) {
            const poolId = batch[index];
            this.poolCache.set(poolId, pool);
            this.log('success', `Added pool to cache: ${pool.name}`, {
              poolId,
              name: pool.name,
              mintA: pool.mintA.symbol,
              mintB: pool.mintB.symbol
            });
          }
        });

        // Add delay between batches if not the last batch
        if (i + BATCH_SIZE < poolIds.length) {
          this.log('info', `Waiting ${this.BATCH_DELAY}ms before next batch`);
          await new Promise(resolve => setTimeout(resolve, this.BATCH_DELAY));
        }
      }

      this.lastCacheUpdate = now;
      this.log('success', `Pool cache update completed`, {
        totalPools: poolIds.length,
        cachedPools: this.poolCache.size,
        timestamp: new Date(now).toISOString()
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error updating pool cache: ${errorMessage}`);
      throw error;
    }
  }

  async getPriceFromPool(poolId: string): Promise<Big> {
    try {
      const pool = this.poolCache.get(poolId);
      if (!pool) {
        throw new Error(`Pool ${poolId} not found in cache`);
      }

      return new Big(pool.price);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting price from pool ${poolId}: ${errorMessage}`);
      throw error;
    }
  }

  async getPoolInfo(poolId: string): Promise<RaydiumPoolResponse | null> {

    console.log('[Raydium] Getting pool info for:', poolId);
    try {
      const pool = this.poolCache.get(poolId);
      if (!pool) {
        await this.updatePoolCache([poolId]);
        return this.poolCache.get(poolId) || null;
      }
      return pool;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting pool info: ${errorMessage}`);
      return null;
    }
  }

  async getLiquidityFromPool(poolId: string): Promise<Big> {
    console.log('[Raydium] Getting liquidity from pool:', poolId);
    try {
      await this.updatePoolCache(this.getAllConfiguredPoolIds());
      const pool = this.poolCache.get(poolId);
      if (!pool) {
        throw new Error(`Pool ${poolId} not found in cache`);
      }
      const liquidity = new Big(pool.tvl);
      this.log('info', `Got liquidity from pool ${poolId}`, {
        poolId,
        liquidity: liquidity.toFixed(2),
        pair: `${pool.mintA.symbol}/${pool.mintB.symbol}`
      });
      return liquidity;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting liquidity from pool ${poolId}: ${errorMessage}`);
      throw error;
    }
  }

  async getPools(): Promise<RaydiumPoolResponse[]> {
    console.log('[Raydium] Getting pools');
    try {
      await this.updatePoolCache(this.getAllConfiguredPoolIds());
      
      return Array.from(this.poolCache.values()).map(pool => ({
        id: pool.id,
        name: pool.name || `${pool.mintA.symbol}/${pool.mintB.symbol}`,
        mintA: {
          address: pool.mintA.address,
          symbol: pool.mintA.symbol,
          decimals: pool.mintA.decimals
        },
        mintB: {
          address: pool.mintB.address,
          symbol: pool.mintB.symbol,
          decimals: pool.mintB.decimals
        },
        tokenAAmount: pool.tokenAAmount,
        tokenBAmount: pool.tokenBAmount,
        price: pool.price || '0',
        tvl: pool.tvl || '0',
        volume24h: pool.volume24h || '0',
        feeRate: pool.feeRate || 0,
        type: pool.type || 'Unknown'
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log('error', `Error getting pools: ${errorMessage}`);
      throw error;
    }
  }

  protected log(type: 'info' | 'success' | 'error', message: string, metadata?: any) {
    if (this.isShuttingDown) return;
    console.log(`[Raydium] ${type.toUpperCase()}: ${message}`, metadata || '');
    this.logCallback?.(type, message, metadata);
  }

  private isValidPoolData(data: any): data is ApiPoolResponse['data'][0] {
    return (
      data &&
      data.mintA && typeof data.mintA.address === 'string' && typeof data.mintA.symbol === 'string' &&
      data.mintB && typeof data.mintB.address === 'string' && typeof data.mintB.symbol === 'string' &&
      typeof data.tokenA === 'string' &&
      typeof data.tokenB === 'string' &&
      typeof data.liquidity === 'string'
    );
  }
}
