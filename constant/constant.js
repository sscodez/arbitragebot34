import { SUPPORTED_CHAINS } from './chains.js';

// Token Addresses (BSC Mainnet)
export const TOKENS = {
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    CAKE: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
    ADA: "0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47",
    DOT: "0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402",
    XRP: "0x1D2F0da169ceb9fC7B3144628dB156f3F6c60dBE",
    MATIC: "0xCC42724C6683B7E57334c4E856f4c9965ED682bD"
};

// Popular Trading Pairs
export const TRADING_PAIRS = [
    {
        name: "WBNB/USDT",
        tokenA: TOKENS.WBNB,
        tokenB: TOKENS.USDT,
        minProfit: "0.1" // 0.1%
    },
    {
        name: "ETH/USDT",
        tokenA: TOKENS.ETH,
        tokenB: TOKENS.USDT,
        minProfit: "0.15"
    },
    {
        name: "BTCB/USDT",
        tokenA: TOKENS.BTCB,
        tokenB: TOKENS.USDT,
        minProfit: "0.12"
    },
    {
        name: "CAKE/USDT",
        tokenA: TOKENS.CAKE,
        tokenB: TOKENS.USDT,
        minProfit: "0.2"
    },
    {
        name: "MATIC/USDT",
        tokenA: TOKENS.MATIC,
        tokenB: TOKENS.USDT,
        minProfit: "0.25"
    },
    {
        name: "WBNB/BUSD",
        tokenA: TOKENS.WBNB,
        tokenB: TOKENS.BUSD,
        minProfit: "0.1"
    },
    {
        name: "ETH/BUSD",
        tokenA: TOKENS.ETH,
        tokenB: TOKENS.BUSD,
        minProfit: "0.15"
    },
    {
        name: "BTCB/BUSD",
        tokenA: TOKENS.BTCB,
        tokenB: TOKENS.BUSD,
        minProfit: "0.12"
    }
];

// DEX Router Addresses
export const DEX_ROUTERS = {
    PANCAKESWAP: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
    BISWAP: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
    APESWAP: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
    MDEX: "0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8"
};

// Minimum amounts for trades (in USD)
export const MIN_TRADE_AMOUNT = {
    WBNB_USDT: "1000",    // $1000 minimum for WBNB/USDT pairs
    ETH_USDT: "1500",     // $1500 minimum for ETH/USDT pairs
    BTCB_USDT: "2000",    // $2000 minimum for BTCB/USDT pairs
    OTHER: "500"          // $500 minimum for other pairs
};

export const GAS_SETTINGS = {
    FAST: {
        gasPrice: '5',
        maxPriorityFeePerGas: '2'
    },
    NORMAL: {
        gasPrice: '3',
        maxPriorityFeePerGas: '1.5'
    },
    SLOW: {
        gasPrice: '2',
        maxPriorityFeePerGas: '1'
    }
};

// Arbitrage configurations for each chain
export const ARBITRAGE_CONFIG = {
    BSC: {
        basePairs: [
            {
                name: "WBNB/USDT",
                baseToken: SUPPORTED_CHAINS.BSC.tokens.WBNB,
                quoteToken: SUPPORTED_CHAINS.BSC.tokens.USDT,
                minProfitPercent: 0.1,
                maxTradeSize: "10", // 10 BNB
                gasLimit: 300000
            },
            {
                name: "ETH/USDT",
                baseToken: SUPPORTED_CHAINS.BSC.tokens.ETH,
                quoteToken: SUPPORTED_CHAINS.BSC.tokens.USDT,
                minProfitPercent: 0.15,
                maxTradeSize: "5", // 5 ETH
                gasLimit: 300000
            },
            {
                name: "BTCB/USDT",
                baseToken: SUPPORTED_CHAINS.BSC.tokens.BTCB,
                quoteToken: SUPPORTED_CHAINS.BSC.tokens.USDT,
                minProfitPercent: 0.12,
                maxTradeSize: "0.5", // 0.5 BTC
                gasLimit: 300000
            }
        ],
        dexPriority: ['PANCAKESWAP', 'BISWAP', 'APESWAP'],
        minProfit: {
            inToken: "0.05", // 0.05 BNB minimum profit
            inUSD: "20" // $20 minimum profit
        }
    },
    POLYGON: {
        basePairs: [
            {
                name: "WMATIC/USDT",
                baseToken: SUPPORTED_CHAINS.POLYGON.tokens.WMATIC,
                quoteToken: SUPPORTED_CHAINS.POLYGON.tokens.USDT,
                minProfitPercent: 0.2,
                maxTradeSize: "10000", // 10000 MATIC
                gasLimit: 250000
            },
            {
                name: "WETH/USDT",
                baseToken: SUPPORTED_CHAINS.POLYGON.tokens.WETH,
                quoteToken: SUPPORTED_CHAINS.POLYGON.tokens.USDT,
                minProfitPercent: 0.15,
                maxTradeSize: "5", // 5 ETH
                gasLimit: 250000
            }
        ],
        dexPriority: ['QUICKSWAP', 'SUSHISWAP'],
        minProfit: {
            inToken: "100", // 100 MATIC minimum profit
            inUSD: "25" // $25 minimum profit
        }
    },
    ARBITRUM: {
        basePairs: [
            {
                name: "WETH/USDT",
                baseToken: SUPPORTED_CHAINS.ARBITRUM.tokens.WETH,
                quoteToken: SUPPORTED_CHAINS.ARBITRUM.tokens.USDT,
                minProfitPercent: 0.15,
                maxTradeSize: "5", // 5 ETH
                gasLimit: 1000000 // Arbitrum needs higher gas limit
            },
            {
                name: "WETH/USDC",
                baseToken: SUPPORTED_CHAINS.ARBITRUM.tokens.WETH,
                quoteToken: SUPPORTED_CHAINS.ARBITRUM.tokens.USDC,
                minProfitPercent: 0.12,
                maxTradeSize: "5", // 5 ETH
                gasLimit: 1000000
            }
        ],
        dexPriority: ['SUSHISWAP', 'CAMELOT'],
        minProfit: {
            inToken: "0.01", // 0.01 ETH minimum profit
            inUSD: "30" // $30 minimum profit
        }
    }
};

// Default settings for each chain
export const CHAIN_SETTINGS = {
    BSC: {
        blockTime: 3,
        confirmations: 1,
        gasMultiplier: 1.2,
        maxGasPrice: '10', // in gwei
        provider: SUPPORTED_CHAINS.BSC.rpc
    },
    POLYGON: {
        blockTime: 2,
        confirmations: 2,
        gasMultiplier: 1.3,
        maxGasPrice: '300', // in gwei
        provider: SUPPORTED_CHAINS.POLYGON.rpc
    },
    ARBITRUM: {
        blockTime: 1,
        confirmations: 1,
        gasMultiplier: 1.1,
        maxGasPrice: '0.1', // in gwei (L2 gas is different)
        provider: SUPPORTED_CHAINS.ARBITRUM.rpc
    }
};
