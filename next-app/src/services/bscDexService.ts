// import { ethers, providers } from 'ethers';
// import { Token, Fetcher, Route, Trade, TradeType, Pair } from '@pancakeswap/sdk';

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

// interface PoolInfo {
//   dex: string;
//   tokenA: TokenInfo;
//   tokenB: TokenInfo;
//   reserve0: string;
//   reserve1: string;
//   price: string;
// }

// type Address = `0x${string}`;

// interface Log {
//   type: string;
//   message: string;
//   timestamp: number;
//   metadata: any;
// }

// export class BscDexService {
//   private provider: providers.Web3Provider;
//   private wallet: any;
//   private chainId = 56; // BSC mainnet
//   private addLog: (log: Log) => void;

//   private readonly PANCAKE_ROUTER = '0x05fF2B0DB69458A0750badebc4f9e3DcF808cEeF'; // PancakeSwap router address
//   private readonly BISWAP_ROUTER = '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'; // BiSwap router address

//   constructor(provider: providers.Web3Provider, wallet: any, addLog: (log: Log) => void) {
//     this.provider = provider;
//     this.wallet = wallet;
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
//       // Log checking PancakeSwap prices
//       this.addLog({
//         type: 'info',
//         message: `Checking PancakeSwap prices for ${symbolA}/${symbolB}`,
//         timestamp: Date.now(),
//         metadata: { dex: 'PancakeSwap', pair: `${symbolA}/${symbolB}` }
//       });

//       const pancakePrice = await this.getPancakeSwapPrice(tokenAAddress, tokenBAddress);
      
//       // Log PancakeSwap prices
//       this.addLog({
//         type: 'info',
//         message: `PancakeSwap ${symbolA}/${symbolB} price: ${pancakePrice.toFixed(8)}`,
//         timestamp: Date.now(),
//         metadata: {
//           dex: 'PancakeSwap',
//           pair: `${symbolA}/${symbolB}`,
//           price: pancakePrice.toFixed(8)
//         }
//       });

//       // Log checking BiSwap prices
//       this.addLog({
//         type: 'info',
//         message: `Checking BiSwap prices for ${symbolA}/${symbolB}`,
//         timestamp: Date.now(),
//         metadata: { dex: 'BiSwap', pair: `${symbolA}/${symbolB}` }
//       });

//       const biswapPrice = await this.getBiSwapPrice(tokenAAddress, tokenBAddress);
      
//       // Log BiSwap prices
//       this.addLog({
//         type: 'info',
//         message: `BiSwap ${symbolA}/${symbolB} price: ${biswapPrice.toFixed(8)}`,
//         timestamp: Date.now(),
//         metadata: {
//           dex: 'BiSwap',
//           pair: `${symbolA}/${symbolB}`,
//           price: biswapPrice.toFixed(8)
//         }
//       });

//       // Calculate profit percentages
//       const pancakeToBiswap = ((biswapPrice - pancakePrice) / pancakePrice) * 100;
//       const biswapToPancake = ((pancakePrice - biswapPrice) / biswapPrice) * 100;

//       const opportunities: ArbitrageOpportunity[] = [];

//       // Check PancakeSwap -> BiSwap
//       if (pancakeToBiswap > minProfitPercent) {
//         opportunities.push({
//           tokenA: { address: tokenAAddress, symbol: symbolA },
//           tokenB: { address: tokenBAddress, symbol: symbolB },
//           profitPercent: pancakeToBiswap,
//           buyDex: 'PancakeSwap',
//           sellDex: 'BiSwap',
//           route: 'PancakeSwap -> BiSwap'
//         });
//       }

//       // Check BiSwap -> PancakeSwap
//       if (biswapToPancake > minProfitPercent) {
//         opportunities.push({
//           tokenA: { address: tokenAAddress, symbol: symbolA },
//           tokenB: { address: tokenBAddress, symbol: symbolB },
//           profitPercent: biswapToPancake,
//           buyDex: 'BiSwap',
//           sellDex: 'PancakeSwap',
//           route: 'BiSwap -> PancakeSwap'
//         });
//       }

//       return opportunities;
//     } catch (error: any) {
//       this.addLog({
//         type: 'error',
//         message: `Error in BSC service: ${error.message}`,
//         timestamp: Date.now(),
//         metadata: {
//           pair: `${symbolA}/${symbolB}`,
//           error: error.message
//         }
//       });
//       throw error;
//     }
//   }

//   private async getPancakeSwapPrice(tokenAAddress: string, tokenBAddress: string): Promise<number> {
//     try {
//       const tokenAInstance = new Token(this.chainId, tokenAAddress, 18, 'TokenA', 'TokenA');
//       const tokenBInstance = new Token(this.chainId, tokenBAddress, 18, 'TokenB', 'TokenB');

//       const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//       const route = new Route([pair], tokenAInstance);

//       const trade = new Trade(
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

//   private async getBiSwapPrice(tokenAAddress: string, tokenBAddress: string): Promise<number> {
//     try {
//       const tokenAInstance = new Token(this.chainId, tokenAAddress, 18, 'TokenA', 'TokenA');
//       const tokenBInstance = new Token(this.chainId, tokenBAddress, 18, 'TokenB', 'TokenB');

//       const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//       const route = new Route([pair], tokenAInstance);

//       const trade = new Trade(
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
//       const [tokenA, tokenB] = await Promise.all([
//         this.getTokenInfo(tokenAAddress, symbolA),
//         this.getTokenInfo(tokenBAddress, symbolB)
//       ]);

//       const amountIn = ethers.utils.parseUnits(amount, tokenA.decimals);

//       if (buyOnFirstDex) {

//         const tokenAInstance = new Token(this.chainId, tokenAAddress, tokenA.decimals, tokenA.symbol, tokenA.name);
//         const tokenBInstance = new Token(this.chainId, tokenBAddress, tokenB.decimals, tokenB.symbol, tokenB.name);

//         const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//         const route = new Route([pair], tokenAInstance);

//         const trade = new Trade(
//           route,
//           new TokenAmount(tokenAInstance, amountIn.toString()),
//           TradeType.EXACT_INPUT
//         );

//         const slippage = new Percent(slippageTolerance, 100); 
//         const amountOutMin = trade.minimumAmountOut(slippage).raw.toString();

//         const router = new ethers.Contract(
//           this.BISWAP_ROUTER,
//           ['function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external'],
//           this.wallet
//         );

//         const tx = await router.swapExactTokensForTokens(
//           amountIn,
//           amountOutMin,
//           [tokenAAddress, tokenBAddress],
//           this.wallet.address,
//           Math.floor(Date.now() / 1000) + 1800
//         );

//         return tx.hash;
//       } else {

//         const tokenAInstance = new Token(this.chainId, tokenAAddress, tokenA.decimals, tokenA.symbol, tokenA.name);
//         const tokenBInstance = new Token(this.chainId, tokenBAddress, tokenB.decimals, tokenB.symbol, tokenB.name);

//         const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
//         const expectedOutput = pair.token1Price.quote(amountIn);

//         const slippage = new Percent(slippageTolerance, 100); 
//         const amountOutMin = expectedOutput.multiply(slippage).quotient.toString();

//         const router = new ethers.Contract(
//           this.PANCAKE_ROUTER,
//           ['function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external'],
//           this.wallet
//         );

//         const tx = await router.swapExactTokensForTokens(
//           amountIn,
//           amountOutMin,
//           [tokenAAddress, tokenBAddress],
//           this.wallet.address,
//           Math.floor(Date.now() / 1000) + 1800
//         );

//         return tx.hash;
//       }
//     } catch (error) {
//       console.error('Error executing arbitrage:', error);
//       throw error;
//     }
//   }
// }
