import { ethers } from 'ethers';
import { ChainId, Token, Fetcher, Route, Trade, TokenAmount, TradeType, Price } from '@biswap/sdk';
import { Token as PancakeToken, Pair as PancakePair } from '@pancakeswap/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { Pancake, BiSwap } from '@/constant/binance';
interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface PoolInfo {
  dex: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  reserve0: string;
  reserve1: string;
  price: string;
}

interface ArbitrageOpportunity {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  profitPercent: number;
  buyDex: string;
  sellDex: string;
  route: string;
}

export class BSCDexService {
  private provider: JsonRpcProvider;
  private wallet: ethers.Wallet;
  private chainId = ChainId.MAINNET; // BSC Mainnet

  private readonly PANCAKE_ROUTER = Pancake['router-address'];
  private readonly BISWAP_ROUTER = BiSwap['router-address'];



  constructor(provider: JsonRpcProvider, wallet: ethers.Wallet) {
    this.provider = provider;
    this.wallet = wallet;
  }

  async getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
    try {
      const pancakeToken = new PancakeToken(this.chainId, tokenAddress, 18); // Default to 18 decimals
      const biswapToken = new Token(this.chainId, tokenAddress, 18);

      return {
        address: tokenAddress,
        decimals: pancakeToken.decimals,
        symbol: await pancakeToken.symbol,
        name: await pancakeToken.name
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw error;
    }
  }

  async findArbitrageOpportunities(
    tokenAAddress: string,
    tokenBAddress: string,
    minProfitPercent: number
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const [tokenA, tokenB] = await Promise.all([
        this.getTokenInfo(tokenAAddress),
        this.getTokenInfo(tokenBAddress)
      ]);

      const pancakeTokenA = new PancakeToken(this.chainId, tokenAAddress, tokenA.decimals);
      const pancakeTokenB = new PancakeToken(this.chainId, tokenBAddress, tokenB.decimals);
      const biswapTokenA = new Token(this.chainId, tokenAAddress, tokenA.decimals);
      const biswapTokenB = new Token(this.chainId, tokenBAddress, tokenB.decimals);

      const [pancakePair, biswapPair] = await Promise.all([
        PancakePair.fetchData(pancakeTokenA, pancakeTokenB, this.provider),
        Fetcher.fetchPairData(biswapTokenA, biswapTokenB, this.provider)
      ]);

      const pancakePrice = pancakePair.token1Price;
      const biswapPrice = new Price(biswapTokenA, biswapTokenB, biswapPair.token0.raw.toString(), biswapPair.token1.raw.toString());

      const priceDiff = Math.abs(
        (Number(pancakePrice.toSignificant(6)) - Number(biswapPrice.toSignificant(6))) / 
        Number(pancakePrice.toSignificant(6)) * 100
      );

      if (priceDiff >= minProfitPercent) {
        const buyOnBiswap = Number(biswapPrice.toSignificant(6)) < Number(pancakePrice.toSignificant(6));
        
        return [{
          tokenA: tokenA,
          tokenB: tokenB,
          profitPercent: priceDiff,
          buyDex: buyOnBiswap ? BiSwap.name : Pancake.name,
          sellDex: buyOnBiswap ? Pancake.name : BiSwap.name,
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
    buyOnBiswap: boolean,
    slippageTolerance: number = 0.5
  ): Promise<string> {
    try {
      const [tokenA, tokenB] = await Promise.all([
        this.getTokenInfo(tokenAAddress),
        this.getTokenInfo(tokenBAddress)
      ]);

      const amountIn = ethers.utils.parseUnits(amount, tokenA.decimals);

      if (buyOnBiswap) {
      
        const tokenAInstance = new Token(this.chainId, tokenAAddress, tokenA.decimals);
        const tokenBInstance = new Token(this.chainId, tokenBAddress, tokenB.decimals);

        const pair = await Fetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
        const route = new Route([pair], tokenAInstance);
        
        const trade = new Trade(
          route,
          new TokenAmount(tokenAInstance, amountIn.toString()),
          TradeType.EXACT_INPUT
        );

        const slippageFactor = 1 - (slippageTolerance / 100);
        const amountOutMin = trade.minimumAmountOut(slippageFactor).raw.toString();

        const router = new ethers.Contract(
          this.BISWAP_ROUTER,
  BiSwap['router-abi'],
          this.wallet
        );

        const tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [tokenAAddress, tokenBAddress],
          this.wallet.address,
          Math.floor(Date.now() / 1000) + 1800
        );

        return tx.hash;
      } else {
     
        const tokenAInstance = new PancakeToken(this.chainId, tokenAAddress, tokenA.decimals);
        const tokenBInstance = new PancakeToken(this.chainId, tokenBAddress, tokenB.decimals);

        const pair = await PancakePair.fetchData(tokenAInstance, tokenBInstance, this.provider);
        const expectedOutput = pair.token1Price.quote(amountIn);
        
        const slippageFactor = 1 - (slippageTolerance / 100);
        const amountOutMin = expectedOutput.multiply(slippageFactor).quotient.toString();

        const router = new ethers.Contract(
          this.PANCAKE_ROUTER,
          Pancake['router-abi'],
          this.wallet
        );

        const tx = await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          [tokenAAddress, tokenBAddress],
          this.wallet.address,
          Math.floor(Date.now() / 1000) + 1800
        );

        return tx.hash;
      }
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      throw error;
    }
  }
}
