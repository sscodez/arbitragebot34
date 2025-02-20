import { ethers } from 'ethers';
import { Token, CurrencyAmount, TradeType, Percent, Price } from '@uniswap/sdk-core';
import { Pool, Route, Trade, TickListDataProvider, TickMath, SqrtPriceMath } from '@uniswap/v3-sdk';
import { Pair, Route as V2Route, Trade as V2Trade } from '@uniswap/v2-sdk';
import { PancakeswapPair, Route as PancakeRoute, Trade as PancakeTrade } from '@pancakeswap/sdk';
import { abi as UniswapV3FactoryABI } from '@/constant/UNISWAP_V3_FACTORY';
import { abi } from '@/constant/UNISWAP_V3_FACTORY';
import { PancakeSwapV2FactoryEth } from '@/constant/PANCAKESWAP_V2_FACTORY';
import { UniswapV3Router } from '@/constant/UNISWAP_V3_ROUTER';
import JSBI from 'jsbi';

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
  private readonly UNISWAP_V3_FACTORY_ADDRESS = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
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

  private async getUniswapV3Pool(
    tokenA: Token,
    tokenB: Token,
    fee: number
  ): Promise<Pool | null> {
    try {
      const factoryContract = new ethers.Contract(
        this.UNISWAP_V3_FACTORY_ADDRESS,
        UniswapV3FactoryABI,
        this.provider
      );

      const poolAddress = await factoryContract.getPool(
        tokenA.address,
        tokenB.address,
        fee
      );

      if (poolAddress === ethers.constants.AddressZero) {
        return null;
      }

      const poolContract = new ethers.Contract(
        poolAddress,
        [
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
          'function fee() external view returns (uint24)',
          'function tickSpacing() external view returns (int24)',
          'function liquidity() external view returns (uint128)',
          'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
          'function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)',
        ],
        this.provider
      );

      const [token0, token1, fee_, tickSpacing, liquidity, slot0] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee(),
        poolContract.tickSpacing(),
        poolContract.liquidity(),
        poolContract.slot0(),
      ]);

      // Convert liquidity to string
      let liquidityStr = '0';
      try {
        if (Array.isArray(liquidity)) {
          const high = liquidity[0].toString();
          const low = liquidity[1].toString();
          const highBN = JSBI.BigInt(high);
          const lowBN = JSBI.BigInt(low);
          const result = JSBI.add(
            JSBI.leftShift(highBN, JSBI.BigInt(32)),
            lowBN
          );
          liquidityStr = result.toString();
        } else if (ethers.BigNumber.isBigNumber(liquidity)) {
          liquidityStr = liquidity.toString();
        } else {
          liquidityStr = liquidity.toString();
        }
      } catch (error) {
        console.error('Error converting liquidity:', error);
        liquidityStr = '1'; // Fallback to minimum liquidity
      }

      const tickSpacingInt = parseInt(tickSpacing.toString());
      const currentTick = parseInt(slot0[1].toString());

      // Ensure current tick is within bounds and properly spaced
      const minTick = TickMath.MIN_TICK - (TickMath.MIN_TICK % tickSpacingInt);
      const maxTick = TickMath.MAX_TICK - (TickMath.MAX_TICK % tickSpacingInt);
      
      const alignedTick = Math.max(
        minTick,
        Math.min(
          maxTick,
          Math.floor(currentTick / tickSpacingInt) * tickSpacingInt
        )
      );

      // Get the sqrt price from the aligned tick
      let sqrtPriceX96 = TickMath.getSqrtRatioAtTick(alignedTick).toString();

      console.log('Pool parameters:', {
        sqrtPriceX96,
        tick: alignedTick,
        tickSpacing: tickSpacingInt,
        liquidity: liquidityStr,
        token0: token0,
        token1: token1,
        minTick,
        maxTick
      });

      // Create a minimal valid tick list
      const ticks = [
        {
          index: minTick,
          liquidityNet: liquidityStr,
          liquidityGross: liquidityStr
        },
        {
          index: maxTick,
          liquidityNet: `-${liquidityStr}`,
          liquidityGross: liquidityStr
        }
      ];

      // Create tick data provider
      const tickDataProvider = new TickListDataProvider(ticks, tickSpacingInt);

      return new Pool(
        tokenA,
        tokenB,
        fee,
        sqrtPriceX96,
        liquidityStr,
        alignedTick,
        tickDataProvider
      );
    } catch (error) {
      console.error(`Error getting Uniswap V3 pool for fee ${fee}:`, error);
      return null;
    }
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

      const feeTiers = [500, 3000, 10000];
      let bestPool = null;
      let bestLiquidity = JSBI.BigInt(0);

      for (const fee of feeTiers) {
        try {
          const pool = await this.getUniswapV3Pool(WETH, USDT, fee);
          if (!pool) continue;

          const liquidityBN = JSBI.BigInt(pool.liquidity);
          
          if (JSBI.greaterThan(liquidityBN, bestLiquidity)) {
            bestPool = pool;
            bestLiquidity = liquidityBN;
          }
        } catch (error) {
          console.log(`Error checking fee tier ${fee}:`, error);
          continue;
        }
      }

      if (!bestPool) {
        throw new Error('No active Uniswap V3 pools found for token pair');
      }

      try {
        console.log('Creating input amount...');
        // Create the input amount with proper decimal handling
        const parsedAmount = ethers.utils.parseUnits(amount, WETH.decimals);
        const inputAmount = CurrencyAmount.fromRawAmount(
          WETH,
          parsedAmount.toString()
        );
        console.log('Input amount created:', {
          currency: inputAmount.currency.symbol,
          amount: inputAmount.toExact()
        });

        console.log('Getting output amount from pool...');
        // Get the quote
        const [outputAmount] = await bestPool.getOutputAmount(inputAmount);
        console.log('Output amount received:', {
          currency: outputAmount.currency.symbol,
          amount: outputAmount.toExact()
        });
        
        console.log('Calculating price...');
        // Calculate the price
        const price = new Price(
          inputAmount.currency,
          outputAmount.currency,
          inputAmount.quotient,
          outputAmount.quotient
        );
        console.log('Price calculated:', {
          price: price.toSignificant(6),
          baseToken: price.baseCurrency.symbol,
          quoteToken: price.quoteCurrency.symbol
        });

        // Calculate USD liquidity
        const bestLiquidityStr = bestLiquidity.toString();
        const tokenAPrice = await this.getTokenPrice(WETH.address);
        const liquidityUSD = ethers.utils.formatEther(
          ethers.BigNumber.from(bestLiquidityStr).mul(tokenAPrice)
        );

        return {
          dex: 'UniswapV3',
          price: price.toSignificant(6),
          liquidityUSD
        };
      } catch (error) {
        console.error('Error calculating Uniswap V3 price:', error);
        throw new Error(`Failed to calculate Uniswap V3 price: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in getUniswapV3Price:', error);
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

      console.log('Getting reserves...');
      const reserveWETH = parseFloat(pair.reserveOf(WETH).toSignificant(18));
      const reserveUSDT = parseFloat(pair.reserveOf(USDT).toSignificant(18));
  
      console.log('Reserves:', { reserveWETH, reserveUSDT });
  
      // Create route and trade first to get accurate price
      console.log('Creating PancakeSwap route...');
      const route = new PancakeRoute([pair], WETH, USDT);

      // Create trade with 1 ETH to get the current price
      console.log('Creating trade with 1 ETH to get price...');
      const oneEth = CurrencyAmount.fromRawAmount(
        WETH,
        ethers.utils.parseUnits('1', WETH.decimals).toString()
      );

      const priceTrade = PancakeTrade.exactIn(route, oneEth);
      const wethPriceUSD = parseFloat(priceTrade.executionPrice.toSignificant(8));
  
      console.log(`WETH price from trade: $${wethPriceUSD.toFixed(2)}`);
  
      // Calculate liquidity using the accurate price
      const reserveWETHUSD = reserveWETH * wethPriceUSD;
      const reserveUSDTUSD = reserveUSDT; // USDT is already in USD
      const liquidityUSD = (reserveWETHUSD + reserveUSDTUSD).toFixed(2);
  
      console.log('Total liquidity in USD:', liquidityUSD);

      // Now create the actual trade with user's amount
      console.log('Creating trade with amount:', amount);
      const inputAmount = CurrencyAmount.fromRawAmount(
        WETH,
        ethers.utils.parseUnits(amount, WETH.decimals).toString()
      );

      console.log('Calculating trade...');
      const trade = PancakeTrade.exactIn(route, inputAmount);

      console.log('Trade calculated successfully:', {
        executionPrice: trade.executionPrice.toSignificant(8),
        route: `${WETH.symbol} -> ${USDT.symbol}`
      });

      return {
        dex: 'PancakeSwap',
        price: wethPriceUSD.toString(), // Use the accurate price we calculated
        liquidityUSD: liquidityUSD
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

  async getCurrentPrices(
    tokenIn: TokenConfig,
    tokenOut: TokenConfig,
    amount: string
  ): Promise<{ [key: string]: PriceQuote }> {
    const prices: { [key: string]: PriceQuote } = {};
    let hasError = false;

    // Get prices from different DEXes sequentially with better error handling
    try {
      console.log('Attempting to get Uniswap V3 price...');
      const uniswapPrice = await this.getUniswapV3Price(tokenIn, tokenOut, amount);
      prices['UniswapV3'] = uniswapPrice;
      console.log('Successfully got Uniswap V3 price:', uniswapPrice);
    } catch (error) {
      console.log('Skipping Uniswap V3 due to no available pools. This is normal, continuing with other DEXes.');
      hasError = true;
    }

    try {
      console.log('Attempting to get PancakeSwap price...');
      const pancakePrice = await this.getPancakeSwapPrice(tokenIn, tokenOut, amount);
      prices['PancakeSwap'] = pancakePrice;
      console.log('Successfully got PancakeSwap price:', pancakePrice);
    } catch (error) {
      console.error('Error getting PancakeSwap price:', error);
      hasError = true;
    }

    if (Object.keys(prices).length === 0) {
      throw new Error('Unable to fetch prices from any DEX');
    }

    return prices;
  }

  async findArbitrageOpportunities(
    tokenIn: TokenConfig,
    tokenOut: TokenConfig,
    amount: string
  ): Promise<ArbitrageOpportunity[]> {
    try {
      console.log('Finding arbitrage opportunities for:', {
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amount
      });

      const prices = await this.getCurrentPrices(tokenIn, tokenOut, amount);
      const opportunities: ArbitrageOpportunity[] = [];

      // Compare prices between different DEXes
      const dexes = Object.keys(prices);
      console.log('Comparing prices between DEXes:', dexes);

      for (let i = 0; i < dexes.length; i++) {
        for (let j = i + 1; j < dexes.length; j++) {
          const dex1 = dexes[i];
          const dex2 = dexes[j];
          const price1 = parseFloat(prices[dex1].price);
          const price2 = parseFloat(prices[dex2].price);

          console.log(`Comparing ${dex1} (${price1}) vs ${dex2} (${price2})`);

          // Calculate profit percentage both ways
          const profit1to2 = ((price2 - price1) / price1) * 100;
          const profit2to1 = ((price1 - price2) / price2) * 100;

          console.log(`Potential profit ${dex1}->${dex2}: ${profit1to2.toFixed(2)}%`);
          console.log(`Potential profit ${dex2}->${dex1}: ${profit2to1.toFixed(2)}%`);

          // Check if there's an opportunity from dex1 to dex2
          if (profit1to2 > 0) {
            console.log(`Found opportunity: Buy on ${dex1}, Sell on ${dex2}`);
            opportunities.push({
              buyDex: dex1,
              sellDex: dex2,
              buyPrice: price1.toString(),
              sellPrice: price2.toString(),
              buyAmount: amount,
              expectedProfit: ((price2 - price1) * parseFloat(amount)).toFixed(8),
              profitPercent: profit1to2.toFixed(2),
              buyLiquidity: prices[dex1].liquidityUSD,
              sellLiquidity: prices[dex2].liquidityUSD,
              hasEnoughLiquidity: true // You might want to add actual liquidity checks here
            });
          }

          // Check if there's an opportunity from dex2 to dex1
          if (profit2to1 > 0) {
            console.log(`Found opportunity: Buy on ${dex2}, Sell on ${dex1}`);
            opportunities.push({
              buyDex: dex2,
              sellDex: dex1,
              buyPrice: price2.toString(),
              sellPrice: price1.toString(),
              buyAmount: amount,
              expectedProfit: ((price1 - price2) * parseFloat(amount)).toFixed(8),
              profitPercent: profit2to1.toFixed(2),
              buyLiquidity: prices[dex2].liquidityUSD,
              sellLiquidity: prices[dex1].liquidityUSD,
              hasEnoughLiquidity: true // You might want to add actual liquidity checks here
            });
          }
        }
      }

      // Sort opportunities by profit percentage
      opportunities.sort((a, b) => parseFloat(b.profitPercent) - parseFloat(a.profitPercent));

      console.log(`Found ${opportunities.length} potential arbitrage opportunities`);
      if (opportunities.length > 0) {
        console.log('Best opportunity:', opportunities[0]);
      }

      return opportunities;
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
      this.validateProvider();

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
      if (error.code === 'INVALID_ARGUMENT' && error.argument === 'signerOrProvider') {
        throw new Error('Invalid wallet connection. Please ensure your wallet is properly connected and try again.');
      } else if (error.message.includes('insufficient balance')) {
        throw new Error('Insufficient funds in wallet to execute trade');
      } else if (error.message.includes('user rejected')) {
        throw new Error('Transaction was rejected by user');
      }
      
      console.error('Trade execution error:', error);
      throw new Error(`Failed to execute trade: ${error.message}`);
    }
  }

  private validateProvider(): void {
    if (!this.provider || !this.provider.getSigner) {
      throw new Error('Provider not initialized or invalid');
    }

    if (!this.signer || !this.signer.getAddress) {
      throw new Error('Signer not initialized or invalid');
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
