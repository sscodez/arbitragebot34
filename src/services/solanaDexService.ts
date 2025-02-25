import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Market, TokenAmount, Token, Liquidity } from '@raydium-io/raydium-sdk';
import { DLMMClient } from '@meteora-ag/dlmm-sdk-public';
import { Raydium, Meteora } from '@/constant/solana';

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

export class SolanaDexService {
  private connection: Connection;
  private wallet: Keypair;
  private meteoraClient: DLMMClient;

  constructor(connection: Connection, wallet: Keypair) {
    this.connection = connection;
    this.wallet = wallet;
    this.meteoraClient = new DLMMClient(connection, Meteora.dlmmProgramId);
  }

  async getTokenInfo(tokenAddress: string, symbol: string): Promise<TokenInfo> {
    try {
      const tokenMint = new PublicKey(tokenAddress);
      const tokenInfo = await this.connection.getParsedAccountInfo(tokenMint);
      const parsedData = tokenInfo.value?.data as any;

      return {
        address: tokenAddress,
        decimals: parsedData.parsed.info.decimals,
        symbol: symbol,
        name: parsedData.parsed.info.name || symbol
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  async findArbitrageOpportunities(
    tokenAAddress: string,
    tokenBAddress: string,
    symbolA: string,
    symbolB: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const [tokenA, tokenB] = await Promise.all([
        this.getTokenInfo(tokenAAddress, symbolA),
        this.getTokenInfo(tokenBAddress, symbolB)
      ]);

      // Get Raydium pool info
      const raydiumPool = await Liquidity.fetchMultipleInfo({
        connection: this.connection,
        pools: [{
          id: new PublicKey(tokenAAddress),
          baseMint: new PublicKey(tokenAAddress),
          quoteMint: new PublicKey(tokenBAddress)
        }]
      });

      // Get Meteora pool info
      const meteoraPools = await this.meteoraClient.getAllPools();
      const meteoraPool = meteoraPools.find(pool => 
        pool.tokenAMint.toBase58() === tokenAAddress && 
        pool.tokenBMint.toBase58() === tokenBAddress
      );

      if (!raydiumPool || !meteoraPool) {
        return [];
      }

      // Calculate prices
      const raydiumPrice = parseFloat(raydiumPool[0].currentPrice.toFixed(6));
      const meteoraPrice = parseFloat(meteoraPool.price.toFixed(6));

      const priceDiff = Math.abs(
        (raydiumPrice - meteoraPrice) / raydiumPrice * 100
      );

      if (priceDiff >= minProfitPercent) {
        const buyOnRaydium = raydiumPrice < meteoraPrice;

        return [{
          tokenA,
          tokenB,
          profitPercent: priceDiff,
          buyDex: buyOnRaydium ? Raydium.name : Meteora.name,
          sellDex: buyOnRaydium ? Meteora.name : Raydium.name,
          route: `${tokenA.symbol} -> ${tokenB.symbol}`
        }];
      }

      return [];
    } catch (error) {
      console.error('Error finding arbitrage opportunities:', error);
      throw error;
    }
  }

  async executeArbitrage(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    buyOnRaydium: boolean,
    slippageTolerance: number = 0.5
  ): Promise<string> {
    try {
      const [tokenA, tokenB] = await Promise.all([
        this.getTokenInfo(tokenAAddress, symbolA),
        this.getTokenInfo(tokenBAddress, symbolB)
      ]);

      const amountIn = new TokenAmount(
        new Token(new PublicKey(tokenAAddress), tokenA.decimals),
        amount
      );

      if (buyOnRaydium) {
        // Execute on Raydium
        const pool = await Liquidity.fetchMultipleInfo({
          connection: this.connection,
          pools: [{
            id: new PublicKey(tokenAAddress),
            baseMint: new PublicKey(tokenAAddress),
            quoteMint: new PublicKey(tokenBAddress)
          }]
        });

        const minAmountOut = pool[0].currentPrice
          .mul(amountIn.toAmount())
          .mul(1 - slippageTolerance / 100);

        const tx = await Liquidity.makeSwapTransaction({
          connection: this.connection,
          poolKeys: pool[0].keys,
          userKeys: {
            tokenAccounts: [],
            owner: this.wallet.publicKey
          },
          amountIn,
          minAmountOut,
          fixedSide: 'in'
        });

        const signature = await this.connection.sendTransaction(tx.transaction, [this.wallet]);
        return signature;

      } else {
        // Execute on Meteora
        const pools = await this.meteoraClient.getAllPools();
        const pool = pools.find(p => 
          p.tokenAMint.toBase58() === tokenAAddress && 
          p.tokenBMint.toBase58() === tokenBAddress
        );

        if (!pool) {
          throw new Error('Pool not found');
        }

        const minAmountOut = pool.price
          .mul(amountIn.toAmount())
          .mul(1 - slippageTolerance / 100);

        const tx = await this.meteoraClient.swap({
          pool,
          amount: amountIn.toAmount(),
          tokenMint: new PublicKey(tokenAAddress),
          slippage: slippageTolerance,
          wallet: this.wallet
        });

        const signature = await this.connection.sendTransaction(tx, [this.wallet]);
        return signature;
      }
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      throw error;
    }
  }
}
