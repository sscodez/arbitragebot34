export const SUPPORTED_CHAINS = {
    BSC: {
        id: 56,
        name: 'Binance Smart Chain',
        rpc: 'https://bsc-dataseed.binance.org',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        blockExplorer: 'https://bscscan.com',
        dexes: {
            PANCAKESWAP: {
                name: 'PancakeSwap',
                factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
                router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
                initCodeHash: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5'
            },
            BISWAP: {
                name: 'BiSwap',
                factory: '0x858E3312ed3A876947EA49d572A7C42DE08af7EE',
                router: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
                initCodeHash: '0xfea293c909d87cd4153593f077b76bb7e94340200f4ee84211ae8e4f9bd7ffdf'
            },
            APESWAP: {
                name: 'ApeSwap',
                factory: '0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6',
                router: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
                initCodeHash: '0xf4ccce374816856d11f00e4069e7cada164065686fbef53c6167a63ec2fd8c5b'
            }
        },
        tokens: {
            WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
            USDT: '0x55d398326f99059fF775485246999027B3197955',
            BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
            ETH: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
            BTCB: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c'
        }
    },
    POLYGON: {
        id: 137,
        name: 'Polygon',
        rpc: 'https://polygon-rpc.com',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18
        },
        blockExplorer: 'https://polygonscan.com',
        dexes: {
            QUICKSWAP: {
                name: 'QuickSwap',
                factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
                router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
                initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f'
            },
            SUSHISWAP: {
                name: 'SushiSwap',
                factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
                router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
                initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'
            }
        },
        tokens: {
            WMATIC: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
            USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            USDC: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
            WETH: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
            WBTC: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6'
        }
    },
    ARBITRUM: {
        id: 42161,
        name: 'Arbitrum',
        rpc: 'https://arb1.arbitrum.io/rpc',
        nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
        },
        blockExplorer: 'https://arbiscan.io',
        dexes: {
            SUSHISWAP: {
                name: 'SushiSwap',
                factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
                router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
                initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303'
            },
            CAMELOT: {
                name: 'Camelot',
                factory: '0x6EcCab422D763aC031210895C81787E87B43A652',
                router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
                initCodeHash: '0x8855c7c1f592c84c5c10e0772b4641f22ae67a8b9c19c73656a33f203afb7ccd'
            }
        },
        tokens: {
            WETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
            USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            USDC: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
            WBTC: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
        }
    },
    SOLANA: {
        id: 'mainnet-beta',
        name: 'Solana',
        rpc: 'https://api.mainnet-beta.solana.com',
        nativeCurrency: {
            name: 'SOL',
            symbol: 'SOL',
            decimals: 9
        },
        blockExplorer: 'https://solscan.io',
        dexes: {
            RAYDIUM: {
                name: 'Raydium',
                programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
                serumProgramId: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin'
            },
            ORCA: {
                name: 'Orca',
                programId: '9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP'
            },
            JUPITER: {
                name: 'Jupiter',
                programId: 'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'
            }
        },
        tokens: {
            WSOL: 'So11111111111111111111111111111111111111112',
            USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
            RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
            SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'
        }
    }
};

export const CHAIN_SETTINGS = {
    BSC: {
        gasLimit: 500000,
        gasPrice: 5000000000, // 5 gwei
        slippage: 0.5, // 0.5%
        minProfit: 0.01, // in BNB
    },
    POLYGON: {
        gasLimit: 1000000,
        gasPrice: 100000000000, // 100 gwei
        slippage: 0.5, // 0.5%
        minProfit: 1, // in MATIC
    },
    ARBITRUM: {
        gasLimit: 1000000,
        gasPrice: 100000000, // 0.1 gwei
        slippage: 0.5, // 0.5%
        minProfit: 0.001, // in ETH
    }
};

export const ARBITRAGE_CONFIG = {
    defaultChain: 'BSC',
    maxHops: 3,
    maxResults: 5,
    minProfitUSD: 1,
    updateInterval: 10000, // 10 seconds
    retryDelay: 1000, // 1 second
    maxRetries: 3,
    defaultGasMultiplier: 1.1,
    priceImpactLimit: 5, // 5%
    minLiquidity: 1000, // $1000 worth of liquidity
    maxPathLength: 4,
};
