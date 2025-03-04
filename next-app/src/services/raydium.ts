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

  async shutdown() {
    super.shutdown();
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests = [];
  }

  setSelectedPairPoolIds(poolIds: string[]) {
    console.log('[Raydium] Setting selected pair pool IDs:', poolIds);
    if (!poolIds || poolIds.length === 0) {
      console.error('[Raydium] Cannot set empty pool IDs');
      throw new Error('Cannot set empty pool IDs');
    }
    this.selectedPairPoolIds = poolIds;
    console.log('[Raydium] Pool IDs set successfully. Total:', poolIds.length);
    
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
    console.log('[Raydium] Starting fetch pool with retry:')
    try {
      console.log('[Raydium] Fetching pool data for:', poolId);
      const apiUrl = `${RAYDIUM_API_ENDPOINT}/ids?ids=${poolId}`;
      console.log('[Raydium] API URL:', apiUrl);

      const response = await fetch(apiUrl);
      console.log('[Raydium] Response status:', response.status);

      if (!response.ok) {
        console.error('[Raydium] Failed to fetch pool data:', {
          poolId,
          status: response.status,
          statusText: response.statusText
        });
        throw new Error(`Failed to fetch pool data: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Raydium] Pool data received:', {
        poolId,
        success: !!data,
        hasData: !!data[poolId]
      });

      if (!data || !data[poolId]) {
        console.error('[Raydium] Invalid pool data:', {
          poolId,
          data
        });
        throw new Error('Invalid pool data received');
      }

      const poolData = data[poolId];
      return poolData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Raydium] Error fetching pool:', {
        poolId,
        error: errorMessage,
        retriesLeft: retries
      });

      if (retries > 0) {
        console.log('[Raydium] Retrying pool fetch...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        return this.fetchPoolWithRetry(poolId, retries - 1);
      }

      this.log('error', `Failed to fetch pool ${poolId} after ${3 - retries} retries: ${errorMessage}`);
      return null;
    }
  }

  private async updatePoolCache(poolIds: string[]) {
    try {
      console.log('[Raydium] Starting pool cache update for', poolIds.length, 'pools');

      // Check if we need to update the cache
      const now = Date.now();
      if (now - this.lastCacheUpdate < this.CACHE_TTL && this.poolCache.size > 0) {
        console.log('[Raydium] Using cached pool data, age:', (now - this.lastCacheUpdate) / 1000, 'seconds');
        return;
      }

      // Process pools in batches to avoid rate limiting
      const BATCH_SIZE = 3;
      console.log('[Raydium] Processing pools in batches of', BATCH_SIZE);

      for (let i = 0; i < poolIds.length; i += BATCH_SIZE) {
        const batch = poolIds.slice(i, i + BATCH_SIZE);
        console.log('[Raydium] Processing batch', Math.floor(i/BATCH_SIZE) + 1, 'of', Math.ceil(poolIds.length/BATCH_SIZE));

        const batchPromises = batch.map(poolId => this.fetchPoolWithRetry(poolId));
        const batchResults = await Promise.all(batchPromises);

        // Filter out null results and add to cache
        batchResults.forEach((pool, index) => {
          if (pool) {
            const poolId = batch[index];
            this.poolCache.set(poolId, pool);
            console.log('[Raydium] Added pool to cache:', {
              poolId,
              name: pool.name,
              mintA: pool.mintA.symbol,
              mintB: pool.mintB.symbol
            });
          }
        });

        // Add delay between batches
        if (i + BATCH_SIZE < poolIds.length) {
          const delay = 1000; // 1 second delay between batches
          console.log('[Raydium] Waiting', delay, 'ms before next batch');
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      this.lastCacheUpdate = now;
      console.log('[Raydium] Pool cache update completed:', {
        totalPools: poolIds.length,
        cachedPools: this.poolCache.size
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Raydium] Error updating pool cache:', errorMessage);
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
