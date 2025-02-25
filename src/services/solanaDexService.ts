import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Market } from '@project-serum/serum';
import { QuoteResponse, SwapResponse } from '@jup-ag/api';
import { Raydium } from '@/constant/solana';

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
  private jupiterApiUrl = 'https://quote-api.jup.ag/v6';

  constructor(connection: Connection, wallet: Keypair) {
    this.connection = new Connection(connection.rpcEndpoint, {
      wsEndpoint: connection.rpcEndpoint.replace('http', 'ws'),
      commitment: 'confirmed'
    });
    this.wallet = wallet;
  }

  async getTokenInfo(tokenAddress: string, symbol: string): Promise<TokenInfo> {
    try {
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
      const opportunities: ArbitrageOpportunity[] = [];
      
      // Get quotes from both directions
      const [forwardQuote, reverseQuote] = await Promise.all([
        this.getQuote(tokenAAddress, tokenBAddress, '1000000'),
        this.getQuote(tokenBAddress, tokenAAddress, '1000000')
      ]);

      // Log pool prices
      console.log({
        type: 'info',
        message: `Pool Prices for ${symbolA}/${symbolB}`,
        timestamp: Date.now(),
        metadata: {
          pair: `${symbolA}/${symbolB}`,
          forwardPrice: this.calculatePrice(forwardQuote),
          reversePrice: this.calculatePrice(reverseQuote),
        }
      });
      
      // Check each route for arbitrage opportunities
      for (const route of forwardQuote.routesInfos) {
        const profitPercent = this.calculateProfitPercent(route);
        
        // Log opportunity if profit exceeds minimum
        if (profitPercent >= minProfitPercent) {
          const opportunity = {
            tokenA: {
              address: tokenAAddress,
              symbol: symbolA,
              decimals: route.marketInfos[0].inputDecimals,
              name: symbolA
            },
            tokenB: {
              address: tokenBAddress,
              symbol: symbolB,
              decimals: route.marketInfos[0].outputDecimals,
              name: symbolB
            },
            profitPercent,
            buyDex: route.marketInfos[0].label,
            sellDex: route.marketInfos[route.marketInfos.length - 1].label,
            route: route.marketInfos.map(info => info.label).join(' -> ')
          };
          
          opportunities.push(opportunity);
          
          // Log the opportunity
          console.log({
            type: 'success',
            message: `Found arbitrage opportunity for ${symbolA}/${symbolB}`,
            timestamp: Date.now(),
            metadata: {
              pair: `${symbolA}/${symbolB}`,
              profitPercent: profitPercent.toFixed(2) + '%',
              route: opportunity.route,
              buyDex: opportunity.buyDex,
              sellDex: opportunity.sellDex,
              buyPrice: this.calculatePrice(route),
              sellPrice: this.calculateReversePrice(route)
            }
          });
        }
      }

      // If no opportunities found, log that as well
      if (opportunities.length === 0) {
        console.log({
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
    } catch (error) {
      console.log({
        type: 'error',
        message: `Error finding arbitrage opportunities: ${error.message}`,
        timestamp: Date.now(),
        metadata: {
          pair: `${symbolA}/${symbolB}`,
          error: error.message
        }
      });
      throw error;
    }
  }

  private async getQuote(inputMint: string, outputMint: string, amount: string): Promise<QuoteResponse> {
    const response = await fetch(`${this.jupiterApiUrl}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputMint,
        outputMint,
        amount,
        slippageBps: 50,
        onlyDirectRoutes: false,
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get quote from Jupiter');
    }

    return await response.json();
  }

  private calculatePrice(quote: QuoteResponse | any): string {
    if (!quote || !quote.outAmount || !quote.inAmount) return '0';
    return (Number(quote.outAmount) / Number(quote.inAmount)).toFixed(6);
  }

  private calculateReversePrice(quote: any): string {
    if (!quote || !quote.outAmount || !quote.inAmount) return '0';
    return (Number(quote.inAmount) / Number(quote.outAmount)).toFixed(6);
  }

  private calculateProfitPercent(route: any): number {
    if (!route || !route.outAmount || !route.inAmount) return 0;
    return (Number(route.outAmount) / Number(route.inAmount) - 1) * 100;
  }

  async executeArbitrage(
    tokenAAddress: string,
    tokenBAddress: string,
    amount: string,
    symbolA: string,
    symbolB: string,
    buyOnFirstDex: boolean,
    slippageTolerance: number = 0.5
  ): Promise<string> {
    try {
      const amountInBaseUnits = (parseFloat(amount) * Math.pow(10, 6)).toString(); // Assuming 6 decimals

      // Get quote
      const quoteResponse = await fetch(`${this.jupiterApiUrl}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputMint: tokenAAddress,
          outputMint: tokenBAddress,
          amount: amountInBaseUnits,
          slippageBps: Math.floor(slippageTolerance * 100),
          onlyDirectRoutes: false,
        })
      });

      if (!quoteResponse.ok) {
        throw new Error('Failed to get quote from Jupiter');
      }

      const quote: QuoteResponse = await quoteResponse.json();
      
      if (quote.routesInfos.length === 0) {
        throw new Error('No routes found for arbitrage');
      }

      // Get swap transaction
      const swapResponse = await fetch(`${this.jupiterApiUrl}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: this.wallet.publicKey.toString(),
          wrapUnwrapSOL: true,
        })
      });

      if (!swapResponse.ok) {
        throw new Error('Failed to get swap transaction from Jupiter');
      }

      const swapResult: SwapResponse = await swapResponse.json();

      // Sign and send the transaction
      const transaction = swapResult.swapTransaction;
      const signature = await this.connection.sendRawTransaction(
        Buffer.from(transaction, 'base64'),
        { skipPreflight: true }
      );

      return signature;
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      throw error;
    }
  }
}
