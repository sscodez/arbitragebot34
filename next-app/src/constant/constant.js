// BSC Token Addresses
export const TOKENS = {
    WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
    BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82'
};

// DEX Router Addresses
export const DEX_ROUTERS = {
    PANCAKESWAP: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    BISWAP: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
    APESWAP: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
    MDEX: '0x7DAe51BD3E3376B8c7c4900E9107f12Be3AF1bA8'
};

// Trading Pairs Configuration
export const TRADING_PAIRS = [
    {
        name: 'WBNB/USDT',
        tokenA: TOKENS.WBNB,
        tokenB: TOKENS.USDT,
        minProfit: 0.5
    },
    {
        name: 'ETH/USDT',
        tokenA: TOKENS.ETH,
        tokenB: TOKENS.USDT,
        minProfit: 0.5
    },
    {
        name: 'BTCB/USDT',
        tokenA: TOKENS.BTCB,
        tokenB: TOKENS.USDT,
        minProfit: 0.5
    },
    {
        name: 'CAKE/USDT',
        tokenA: TOKENS.CAKE,
        tokenB: TOKENS.USDT,
        minProfit: 0.5
    },
    {
        name: 'WBNB/BUSD',
        tokenA: TOKENS.WBNB,
        tokenB: TOKENS.BUSD,
        minProfit: 0.5
    }
];

// Minimum trade amounts in USD
export const MIN_TRADE_AMOUNT = 0.1; // 0.1 BNB/ETH/etc for price checks

// Gas settings for transactions
export const GAS_SETTINGS = {
    FAST: {
        gasPrice: '5', // 5 Gwei
        gasLimit: 300000
    },
    NORMAL: {
        gasPrice: '3', // 3 Gwei
        gasLimit: 300000
    }
};
