import { ethers } from 'ethers';
import { Token, CurrencyAmount, TradeType, Percent } from '@uniswap/sdk-core';
import { Pool, Route, Trade } from '@uniswap/v3-sdk';
import { Pair, Route as V2Route, Trade as V2Trade } from '@uniswap/v2-sdk';
import { PancakeswapPair, Route as PancakeRoute, Trade as PancakeTrade } from '@pancakeswap/sdk';
import * as curveApi from '@curvefi/api';
import { abi } from '@/constant/UNISWAP_V3_FACTORY';
import { PancakeSwapV2FactoryEth } from '@/constant/PANCAKESWAP_V2_FACTORY';
import { UniswapV3Router } from '@/constant/UNISWAP_V3_ROUTER';

interface TokenConfig {
  address: string;
  decimals: number;
  symbol: string;
  name: string;
}

interface PriceQuote {
  dex: string;
  price: string;
  liquidityUSD: string;
}

interface ArbitrageOpportunity {
  buyDex: string;
  sellDex: string;
  buyPrice: string;
  sellPrice: string;
  profitPercent: string;
  expectedProfit: string;
  route: string;
  buyAmount: string;
  sellAmount: string;
  timestamp: number;
  hasEnoughLiquidity: boolean;
  buyLiquidity: string;
  sellLiquidity: string;
}

interface ExecuteTradeParams {
  tokenIn: TokenConfig;
  tokenOut: TokenConfig;
  amount: string;
  dex: string;
  slippageTolerance: number;
}

interface TradeResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  outputAmount?: string;
}

class DexService {
  private provider: ethers.providers.Provider;
  private curveInstance: any;
  private tokens: Map<string, Token>;
  private chainId: number;
  private signer?: ethers.Signer;

  // Uniswap V3 Contract Addresses
  private readonly UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  private readonly UNISWAP_V3_QUOTER = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';

  constructor(provider: ethers.providers.Provider, chainId: number = 1, signer?: ethers.Signer) {
    this.provider = provider;
    this.chainId = chainId;
    this.signer = signer;
    this.tokens = new Map();
    this.initializeCurve();
  }

  public setSigner(signer: ethers.Signer) {
    this.signer = signer;
  }

  private async initializeCurve() {
    try {
      // Skip Curve initialization for now as it requires additional setup
      this.curveInstance = null;
      return;

      // Uncomment and configure properly when Curve integration is needed
      /*
      const network = this.chainId === 1 ? 'mainnet' : 'arbitrum';
      this.curveInstance = new curveApi.default({
        network,
        provider: this.provider,
        chainId: this.chainId,
      });
      await this.curveInstance.init();
      */
    } catch (error) {
      console.error('Error initializing Curve API:', error);
      this.curveInstance = null; // Set to null on error
    }
  }

  private async getToken(config: TokenConfig): Promise<Token> {
    const key = `${config.symbol}-${config.address}`;
    if (!this.tokens.has(key)) {
      this.tokens.set(
        key,
        new Token(
          this.chainId,
          config.address,
          config.decimals,
          config.symbol,
          config.name
        )
      );
    }
    return this.tokens.get(key)!;
  }

  private async getUniswapV3Pool(tokenA: Token, tokenB: Token, fee: number = 500): Promise<Pool> {
    const factoryContract = new ethers.Contract(
      this.UNISWAP_V3_FACTORY,
      abi,
      this.provider
    );


    const poolAddress = await factoryContract.getPool(tokenA.address, tokenB.address, fee);
    if (poolAddress === ethers.constants.AddressZero) {
      throw new Error('No Uniswap V3 pool found for token pair');
    }

    const poolContract = new ethers.Contract(
      poolAddress,
      [
        'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
        'function liquidity() external view returns (uint128)',
        'function fee() external view returns (uint24)'
      ],
      this.provider
    );

    const [slot0, liquidity] = await Promise.all([
      poolContract.slot0(),
      poolContract.liquidity()
    ]);

    return new Pool(
      tokenA,
      tokenB,
      fee,
      slot0.sqrtPriceX96.toString(),
      liquidity.toString(),
      slot0.tick
    );
  }

  async getUniswapV3Price(
    tokenIn: TokenConfig,
    tokenOut: TokenConfig,
    amount: string
  ): Promise<PriceQuote> {
    try {
      const WETH = new Token(
        1, // chainId
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        18,
        'WETH',
        'Wrapped Ether'
      );

      const USDT = new Token(
        1, // chainId
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        6,
        'USDT',
        'Tether USD'
      );


      // Try different fee tiers (0.05%, 0.3%, 1%)
      const feeTiers = [500, 3000, 10000];
      let bestPool: Pool | null = null;
      let bestLiquidity = ethers.BigNumber.from(0);

      // Find the pool with the most liquidity
      for (const fee of feeTiers) {
        try {
          const pool = await this.getUniswapV3Pool(WETH, USDT, fee);
          const liquidity = ethers.BigNumber.from(pool.liquidity);
          if (liquidity.gt(bestLiquidity)) {
            bestPool = pool;
            bestLiquidity = liquidity;
          }
        } catch (error) {
          console.debug(`No pool found for fee tier ${fee}`);
        }
      }

      if (!bestPool) {
        throw new Error('No active Uniswap V3 pools found for token pair');
      }

      const inputAmount = CurrencyAmount.fromRawAmount(
        WETH,
        ethers.utils.parseUnits(amount, WETH.decimals).toString()
      );

      const route = new Route([bestPool], WETH, USDT);
      const trade = await Trade.createUncheckedTrade({
        route,
        inputAmount,
        tradeType: TradeType.EXACT_INPUT,
      });

      // Calculate USD liquidity (simplified)
      const tokenAPrice = await this.getTokenPrice(WETH.address);
      const liquidityUSD = ethers.utils.formatEther(bestLiquidity.mul(tokenAPrice));

      return {
        dex: 'Uniswap V3',
        price: trade.executionPrice.toSignificant(8),
        liquidityUSD
      };
    } catch (error) {
      console.error('Error getting Uniswap V3 price:', error);
      throw error;
    }
  }

  private async getTokenPrice(tokenAddress: string): Promise<ethers.BigNumber> {
    // For now, return a mock price of $1 for testing
    // In production, you would fetch this from an oracle or price feed
    return ethers.utils.parseEther('1');
  }

  async getPancakeSwapPrice(
    tokenIn: TokenConfig,
    tokenOut: TokenConfig,
    amount: string
  ): Promise<PriceQuote> {
    try {
      // Create proper Token instances for PancakeSwap SDK
      const WETH = new Token(
        1, // chainId
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        18,
        'WETH',
        'Wrapped Ether'
      );

      const USDT = new Token(
        1, // chainId
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        6,
        'USDT',
        'Tether USD'
      );

      console.log('Getting PancakeSwap price for:', {
        tokenA: WETH.symbol,
        tokenB: USDT.symbol,
        amount
      });

      // Get pair and create route
      console.log('Fetching PancakeSwap pair...');
      const pair = await this.getPancakeSwapPair(WETH, USDT);
      console.log('Creating PancakeSwap route...');
      const route = new PancakeRoute([pair], WETH, USDT);

      // Create trade
      console.log('Creating trade with amount:', amount);
      const inputAmount = CurrencyAmount.fromRawAmount(
        WETH,
        ethers.utils.parseUnits(amount, WETH.decimals).toString()
      );

      console.log('Calculating trade...');
      const trade = PancakeTrade.exactIn(route, inputAmount);

      console.log('Trade calculated successfully:', {
        executionPrice: trade.executionPrice.toSignificant(6),
        route: `${WETH.symbol} -> ${USDT.symbol}`
      });

      return {
        dex: 'PancakeSwap',
        price: trade.executionPrice.toSignificant(6),
        liquidityUSD: 'TBD'
      };

    } catch (error) {
      console.error('Error getting PancakeSwap price:', {
        error,
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amount
      });
      throw error;
    }
  }

  async getCurrentPrices(tokenIn: TokenConfig, tokenOut: TokenConfig, amount: string = '1'): Promise<Record<string, PriceQuote>> {
    const prices: Record<string, PriceQuote> = {};
    let hasError = false;

    // Get prices from different DEXes sequentially with better error handling
    try {
      const uniswapPrice = await this.getUniswapV3Price(tokenIn, tokenOut, amount);
      prices['UniswapV3'] = uniswapPrice;
    } catch (error) {
      console.error('Error getting Uniswap V3 price:', error);
      hasError = true;
    }

    try {
      const pancakePrice = await this.getPancakeSwapPrice(tokenIn, tokenOut, amount);
      prices['PancakeSwap'] = pancakePrice;
    } catch (error) {
      console.error('Error getting PancakeSwap price:', error);
      hasError = true;
    }

    // Skip Curve for now as it's not initialized
    /*
    if (this.curveInstance) {
      try {
        const curvePrice = await this.getCurvePrice(tokenIn, tokenOut, amount);
        prices['Curve'] = curvePrice;
      } catch (error) {
        console.error('Error getting Curve price:', error);
        hasError = true;
      }
    }
    */

    if (Object.keys(prices).length === 0) {
      if (hasError) {
        throw new Error('Failed to fetch prices from all DEXes');
      } else {
        throw new Error('No DEX available for price quotes');
      }
    }

    return prices;
  }

  async findArbitrageOpportunities(
    tokenIn: TokenConfig,
    tokenOut: TokenConfig,
    amount: string
  ): Promise<ArbitrageOpportunity[]> {
    try {
      const prices = await this.getCurrentPrices(tokenIn, tokenOut, amount);
      const opportunities: ArbitrageOpportunity[] = [];

      // Compare prices between different DEXes
      const dexes = Object.keys(prices);
      for (let i = 0; i < dexes.length; i++) {
        for (let j = i + 1; j < dexes.length; j++) {
          const dex1 = dexes[i];
          const dex2 = dexes[j];
          const price1 = parseFloat(prices[dex1].price);
          const price2 = parseFloat(prices[dex2].price);

          // Calculate potential profit
          const profitPercent = Math.abs(((price2 - price1) / price1) * 100);
          const expectedProfit = (parseFloat(amount) * Math.abs(price2 - price1)).toString();

          // Determine buy and sell DEXes
          let buyDex, sellDex, buyPrice, sellPrice;
          if (price1 < price2) {
            buyDex = dex1;
            sellDex = dex2;
            buyPrice = price1;
            sellPrice = price2;
          } else {
            buyDex = dex2;
            sellDex = dex1;
            buyPrice = price2;
            sellPrice = price1;
          }

          // Calculate amounts
          const buyAmount = amount;
          const sellAmount = (parseFloat(amount) * sellPrice).toString();
          const profitAmount = (parseFloat(sellAmount) - parseFloat(buyAmount)).toString();

          // Check liquidity
          const buyLiquidity = parseFloat(prices[buyDex].liquidityUSD);
          const sellLiquidity = parseFloat(prices[sellDex].liquidityUSD);
          const hasEnoughLiquidity = buyLiquidity >= parseFloat(buyAmount) &&
            sellLiquidity >= parseFloat(sellAmount);

          if (profitPercent > 0) {
            opportunities.push({
              buyDex,
              sellDex,
              buyPrice: buyPrice.toString(),
              sellPrice: sellPrice.toString(),
              profitPercent: profitPercent.toFixed(4),
              expectedProfit: profitAmount,
              route: `${buyDex} -> ${sellDex}`,
              buyAmount,
              sellAmount,
              timestamp: Date.now(),
              hasEnoughLiquidity,
              buyLiquidity: buyLiquidity.toString(),
              sellLiquidity: sellLiquidity.toString()
            });
          }
        }
      }

      // Sort by profit percentage in descending order
      return opportunities.sort((a, b) => parseFloat(b.profitPercent) - parseFloat(a.profitPercent));
    } catch (error) {
      console.error('Error finding arbitrage opportunities:', error);
      throw error;
    }
  }

  async executeTrade({
    tokenIn,
    tokenOut,
    amount,
    dex,
    slippageTolerance
  }: ExecuteTradeParams): Promise<TradeResult> {
    if (!this.signer) {
      return {
        success: false,
        error: 'Signer not set. Please connect wallet first.'
      };
    }

    try {
      const tokenAContract = new ethers.Contract(
        tokenIn.address,
        ['function approve(address spender, uint256 amount) public returns (bool)'],
        this.signer
      );

      let trade;
      let router;
      const slippagePercent = new Percent(Math.floor(slippageTolerance * 100), 10000); // Convert to basis points

      switch (dex.toLowerCase()) {
        case 'uniswapv3': {
          const pool = await this.getUniswapV3Pool(await this.getToken(tokenIn), await this.getToken(tokenOut));
          const route = new Route([pool], await this.getToken(tokenIn), await this.getToken(tokenOut));
          const inputAmount = CurrencyAmount.fromRawAmount(
            await this.getToken(tokenIn),
            ethers.utils.parseUnits(amount, tokenIn.decimals).toString()
          );
          trade = await Trade.createUncheckedTrade({
            route,
            inputAmount,
            tradeType: TradeType.EXACT_INPUT,
          });
          // Approve router
          await tokenAContract.approve(this.getUniswapV3RouterAddress(), ethers.constants.MaxUint256);
          router = this.getUniswapV3Router(this.signer);
          break;
        }
        // Add cases for other DEXes (Uniswap V2, PancakeSwap, etc.)
        default:
          return {
            success: false,
            error: `Unsupported DEX: ${dex}`
          };
      }

      // Execute the trade
      const tx = await router.exactInput({
        path: trade.route.path,
        recipient: await this.signer.getAddress(),
        deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        amountIn: trade.inputAmount.quotient.toString(),
        amountOutMinimum: trade.minimumAmountOut(slippagePercent).quotient.toString(),
      });

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.transactionHash,
        outputAmount: trade.outputAmount.toSignificant(6)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  private getUniswapV3RouterAddress(): string {
    return this.chainId === 1
      ? '0xE592427A0AEce92De3Edee1F18E0157C05861564' // Mainnet
      : '0xE592427A0AEce92De3Edee1F18E0157C05861564'; // Arbitrum
  }

  private getUniswapV3Router(signer: ethers.Signer): ethers.Contract {
    return new ethers.Contract(
      this.getUniswapV3RouterAddress(),
      UniswapV3Router,
      signer
    );
  }

  // Helper methods for pool interactions
  private async getPancakeSwapPair(tokenA: Token, tokenB: Token): Promise<Pair> {
    const PANCAKESWAP_FACTORY = '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362';
    const PAIR_ABI = [
      'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
      'function token0() external view returns (address)',
      'function token1() external view returns (address)'
    ];

    try {
      const factoryContract = new ethers.Contract(
        PANCAKESWAP_FACTORY,
        PancakeSwapV2FactoryEth,
        this.provider
      );

      console.log('Getting pair address for tokens:', {
        tokenA: tokenA.address,
        tokenB: tokenB.address
      });

      // Get the pair address
      const pairAddress = await factoryContract.getPair(tokenA.address, tokenB.address);

      if (pairAddress === ethers.constants.AddressZero) {
        throw new Error('No PancakeSwap pair found for token pair');
      }

      console.log('Found pair address:', pairAddress);

      // Create pair contract with correct ABI
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);

      // Fetch reserves
      console.log('Fetching reserves...');
      const [reserve0, reserve1] = await pairContract.getReserves();
      console.log('Got reserves:', { reserve0: reserve0.toString(), reserve1: reserve1.toString() });

      const [token0, token1] =
        tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
          ? [tokenA, tokenB]
          : [tokenB, tokenA];

      return new Pair(
        CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
        CurrencyAmount.fromRawAmount(token1, reserve1.toString())
      );
    } catch (error) {
      console.error('Error fetching PancakeSwap pair:', error);
      throw error;
    }
  }
}

export default DexService;
