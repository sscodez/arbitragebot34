// import { ethers, providers } from 'ethers';
// import {
//   ChainId,
//   Token as UniToken,
//   Pair as UniPair,
//   Route as UniRoute,
//   Trade as UniTrade,
//   TradeType,
//   Percent,
//   CurrencyAmount,
//   TokenAmount
// } from '@uniswap/sdk';
// import { JsonRpcProvider } from '@ethersproject/providers';
// import { Fetcher } from '@uniswap/sdk';

// interface TokenInfo {
//   address: string;
//   symbol: string;
//   decimals: number;
//   name: string;
// }

// interface ArbitrageOpportunity {
//   tokenA: TokenInfo;
//   tokenB: TokenInfo;
//   profitPercent: number;
//   buyDex: string;
//   sellDex: string;
//   route: string;
// }

// interface Log {
//   type: string;
//   message: string;
//   timestamp: number;
//   metadata: any;
// }

// export class EthDexService {
//   private provider: providers.Web3Provider;
//   private addLog: (log: Log) => void;

//   constructor(provider: providers.Web3Provider, addLog: (log: Log) => void) {
//     this.provider = provider;
//     this.addLog = addLog;
//   }

//   async getTokenInfo(tokenAddress: string, symbol: string): Promise<TokenInfo> {
//     try {
//       const tokenContract = new ethers.Contract(
//         tokenAddress,
//         ['function decimals() view returns (uint8)', 'function name() view returns (string)'],
//         this.provider
//       );

//       const [decimals, name] = await Promise.all([
//         tokenContract.decimals(),
//         tokenContract.name()
//       ]);

//       return {
//         address: tokenAddress,
//         symbol,
//         decimals,
//         name
//       };
//     } catch (error) {
//       console.error('Error getting token info:', error);
//       throw error;
//     }
//   }

//   async findArbitrageOpportunities(
//     tokenAAddress: string,
//     tokenBAddress: string,
//     symbolA: string,
//     symbolB: string,
//     minProfitPercent: number
//   ): Promise<ArbitrageOpportunity[]> {
//     try {
//       // Log checking Uniswap prices
//       this.addLog({
//         type: 'info',
//         message: `Checking Uniswap prices for ${symbolA}/${symbolB}`,
//         timestamp: Date.now(),
//         metadata: { dex: 'Uniswap', pair: `${symbolA}/${symbolB}` }
//       });

//       const uniswapPrice = await this.getUniswapPrice(tokenAAddress, tokenBAddress);
      
//       // Log Uniswap prices
//       this.addLog({
//         type: 'info',
//         message: `Uniswap ${symbolA}/${symbolB} price: ${uniswapPrice.toFixed(8)}`,
//         timestamp: Date.now(),
//         metadata: {
//           dex: 'Uniswap',
//           pair: `${symbolA}/${symbolB}`,
//           price: uniswapPrice.toFixed(8)
//         }
//       });

//       // Log checking Sushiswap prices
//       this.addLog({
//         type: 'info',
//         message: `Checking Sushiswap prices for ${symbolA}/${symbolB}`,
//         timestamp: Date.now(),
//         metadata: { dex: 'Sushiswap', pair: `${symbolA}/${symbolB}` }
//       });

//       const sushiPrice = await this.getSushiswapPrice(tokenAAddress, tokenBAddress);
      
//       // Log Sushiswap prices
//       this.addLog({
//         type: 'info',
//         message: `Sushiswap ${symbolA}/${symbolB} price: ${sushiPrice.toFixed(8)}`,
//         timestamp: Date.now(),
//         metadata: {
//           dex: 'Sushiswap',
//           pair: `${symbolA}/${symbolB}`,
//           price: sushiPrice.toFixed(8)
//         }
//       });

//       // Calculate profit percentages
//       const uniToSushi = ((sushiPrice - uniswapPrice) / uniswapPrice) * 100;
//       const sushiToUni = ((uniswapPrice - sushiPrice) / sushiPrice) * 100;

//       const opportunities: ArbitrageOpportunity[] = [];

//       // Check Uniswap -> Sushiswap
//       if (uniToSushi > minProfitPercent) {
//         opportunities.push({
//           tokenA: { address: tokenAAddress, symbol: symbolA },
//           tokenB: { address: tokenBAddress, symbol: symbolB },
//           profitPercent: uniToSushi,
//           buyDex: 'Uniswap',
//           sellDex: 'Sushiswap',
//           route: 'Uniswap -> Sushiswap'
//         });
//       }

//       // Check Sushiswap -> Uniswap
//       if (sushiToUni > minProfitPercent) {
//         opportunities.push({
//           tokenA: { address: tokenAAddress, symbol: symbolA },
//           tokenB: { address: tokenBAddress, symbol: symbolB },
//           profitPercent: sushiToUni,
//           buyDex: 'Sushiswap',
//           sellDex: 'Uniswap',
//           route: 'Sushiswap -> Uniswap'
//         });
//       }

//       return opportunities;
//     } catch (error: any) {
//       this.addLog({
//         type: 'error',
//         message: `Error in ETH service: ${error.message}`,
//         timestamp: Date.now(),
//         metadata: {
//           pair: `${symbolA}/${symbolB}`,
//           error: error.message
//         }
//       });
//       throw error;
//     }
//   }

//   private async getUniswapPrice(tokenAAddress: string, tokenBAddress: string): Promise<number> {
//     try {
//       const tokenAInstance = new UniToken(
//         ChainId.MAINNET,
//         tokenAAddress,
//         18,
//         'TokenA',
//         'TokenA'
//       );

//       const tokenBInstance = new UniToken(
//         ChainId.MAINNET,
//         tokenBAddress,
//         18,
//         'TokenB',
//         'TokenB'
//       );

//       const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//       const route = new UniRoute([pair], tokenAInstance);

//       const trade = new UniTrade(
//         route,
//         new TokenAmount(tokenAInstance, '1000000000000000000'),
//         TradeType.EXACT_INPUT
//       );

//       const expectedOutput = pair.token1Price.quote(trade.inputAmount);

//       return parseFloat(expectedOutput.toSignificant(6));
//     } catch {
//       return 0;
//     }
//   }

//   private async getSushiswapPrice(tokenAAddress: string, tokenBAddress: string): Promise<number> {
//     try {
//       const tokenAInstance = new UniToken(
//         ChainId.MAINNET,
//         tokenAAddress,
//         18,
//         'TokenA',
//         'TokenA'
//       );

//       const tokenBInstance = new UniToken(
//         ChainId.MAINNET,
//         tokenBAddress,
//         18,
//         'TokenB',
//         'TokenB'
//       );

//       const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//       const route = new UniRoute([pair], tokenAInstance);

//       const trade = new UniTrade(
//         route,
//         new TokenAmount(tokenAInstance, '1000000000000000000'),
//         TradeType.EXACT_INPUT
//       );

//       const expectedOutput = pair.token1Price.quote(trade.inputAmount);

//       return parseFloat(expectedOutput.toSignificant(6));
//     } catch {
//       return 0;
//     }
//   }

//   async executeArbitrage(
//     tokenAAddress: string,
//     tokenBAddress: string,
//     amount: string,
//     symbolA: string,
//     symbolB: string,
//     buyOnFirstDex: boolean,
//     slippageTolerance: number = 0.5
//   ): Promise<string> {
//     try {
//       // For now, just throw an error as we need to implement the actual arbitrage execution
//       throw new Error('Arbitrage execution not yet implemented for ETH');
//     } catch (error) {
//       console.error('Error executing arbitrage:', error);
//       throw error;
//     }
//   }
// }
