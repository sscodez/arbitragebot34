import { ethers } from 'ethers';
import { Token, Fetcher as UniswapFetcher, Route as UniswapRoute, Trade as UniswapTrade, TradeType, Pair as UniswapPair } from '@uniswap/v2-sdk';
import { Token as PancakeToken, Fetcher as PancakeFetcher, Route as PancakeRoute, Trade as PancakeTrade, Pair as PancakePair } from '@pancakeswap/sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { UniswapV2, PancakeV2 } from '@/constant/ethereum';
import { Percent } from '@uniswap/sdk-core';

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

type Address = `0x${string}`;

export class ETHDexService {
  private provider: JsonRpcProvider;
  private wallet: ethers.Wallet;
  private chainId: number = 1; // Ethereum mainnet

  private readonly UNISWAP_ROUTER = UniswapV2['router-address'];
  private readonly PANCAKE_ROUTER = PancakeV2['router-address'];

  constructor(provider: JsonRpcProvider, wallet: ethers.Wallet) {
    this.provider = provider;
    this.wallet = wallet;
  }

  async getTokenInfo(tokenAddress: string, symbol: string): Promise<TokenInfo> {
    try {
      const uniswapToken = new Token(this.chainId, tokenAddress as Address, 18, symbol);
      return {
        address: tokenAddress,
        decimals: uniswapToken.decimals,
        symbol: await uniswapToken.symbol,
        name: await uniswapToken.name
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

      const uniswapTokenA = new Token(this.chainId, tokenAAddress as Address, tokenA.decimals, symbolA);
      const uniswapTokenB = new Token(this.chainId, tokenBAddress as Address, tokenB.decimals, symbolB);
      const pancakeTokenA = new PancakeToken(this.chainId, tokenAAddress as Address, tokenA.decimals, symbolA);
      const pancakeTokenB = new PancakeToken(this.chainId, tokenBAddress as Address, tokenB.decimals, symbolB);

      const [uniswapPair, pancakePair] = await Promise.all([
        UniswapFetcher.fetchPairData(uniswapTokenA, uniswapTokenB, this.provider),
        PancakeFetcher.fetchPairData(pancakeTokenA, pancakeTokenB, this.provider)
      ]);

      const uniswapPrice = uniswapPair.token1Price;
      const pancakePrice = pancakePair.token1Price;

      const priceDiff = Math.abs(
        (Number(uniswapPrice.toSignificant(6)) - Number(pancakePrice.toSignificant(6))) /
        Number(uniswapPrice.toSignificant(6)) * 100
      );

      if (priceDiff >= minProfitPercent) {
        const buyOnUniswap = Number(uniswapPrice.toSignificant(6)) < Number(pancakePrice.toSignificant(6));

        return [{
          tokenA: tokenA,
          tokenB: tokenB,
          profitPercent: priceDiff,
          buyDex: buyOnUniswap ? UniswapV2.name : PancakeV2.name,
          sellDex: buyOnUniswap ? PancakeV2.name : UniswapV2.name,
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
    buyOnUniswap: boolean,
    slippageTolerance: number = 0.5
  ): Promise<string> {
    try {
      const [tokenA, tokenB] = await Promise.all([
        this.getTokenInfo(tokenAAddress, symbolA),
        this.getTokenInfo(tokenBAddress, symbolB)
      ]);

      const amountIn = ethers.utils.parseUnits(amount, tokenA.decimals);

      if (buyOnUniswap) {
        const tokenAInstance = new Token(this.chainId, tokenAAddress as Address, tokenA.decimals, symbolA);
        const tokenBInstance = new Token(this.chainId, tokenBAddress as Address, tokenB.decimals, symbolB);

        const pair = await UniswapFetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
        const route = new UniswapRoute([pair], tokenAInstance);

        const trade = new UniswapTrade(
          route,
          new TokenAmount(tokenAInstance, amountIn.toString()),
          TradeType.EXACT_INPUT
        );

        const slippage = new Percent(slippageTolerance, 100);
        const amountOutMin = trade.minimumAmountOut(slippage).raw.toString();

        const router = new ethers.Contract(
          this.UNISWAP_ROUTER,
          UniswapV2['router-abi'],
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
        const tokenAInstance = new PancakeToken(this.chainId, tokenAAddress as Address, tokenA.decimals, symbolA);
        const tokenBInstance = new PancakeToken(this.chainId, tokenBAddress as Address, tokenB.decimals, symbolB);

        const pair = await PancakeFetcher.fetchPairData(tokenAInstance, tokenBInstance, this.provider);
        const route = new PancakeRoute([pair], tokenAInstance);

        const trade = new PancakeTrade(
          route,
          new TokenAmount(tokenAInstance, amountIn.toString()),
          TradeType.EXACT_INPUT
        );

        const slippage = new Percent(slippageTolerance, 100);
        const amountOutMin = trade.minimumAmountOut(slippage).raw.toString();

        const router = new ethers.Contract(
          this.PANCAKE_ROUTER,
          PancakeV2['router-abi'],
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
