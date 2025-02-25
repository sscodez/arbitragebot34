import { ChainType } from '@/services/ArbitrageService';

export interface TokenConfig {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  icon?: string;
}

export interface DexConfig {
  name: string;
  routerAddress?: string;
  factoryAddress?: string;
  initCodeHash?: string;
}

export interface ChainConfig {
  id: number | string;
  name: string;
  symbol: string;
  rpc: string;
  wsRpc?: string;
  blockExplorer?: string;
  icon?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  tokens: { [key: string]: TokenConfig };
  dexes: { [key: string]: DexConfig };
}

export const SUPPORTED_CHAINS: { [key: string]: ChainConfig } = {
  SOLANA: {
    id: 'mainnet-beta',
    name: 'Solana',
    symbol: 'SOL',
    rpc: process.env.VITE_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    wsRpc: process.env.VITE_SOLANA_WS_URL,
    blockExplorer: 'https://solscan.io',
    icon: '',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    tokens: {
      SOL: {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        decimals: 9,
        name: 'Solana',
        icon: ''
      },
      USDC: {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        icon: ''
      },
      USDT: {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
        icon: ''
      },
      RAY: {
        address: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
        symbol: 'RAY',
        decimals: 6,
        name: 'Raydium',
        icon: ''
      },
      ORCA: {
        address: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
        symbol: 'ORCA',
        decimals: 6,
        name: 'Orca',
        icon: ''
      }
    },
    dexes: {
      JUPITER: {
        name: 'Jupiter',
      },
      ORCA: {
        name: 'Orca',
      }
    }
  },
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpc: process.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: '',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    },
    tokens: {
      WBNB: {
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        symbol: 'WBNB',
        decimals: 18,
        name: 'Wrapped BNB',
        icon: ''
      },
      BUSD: {
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        symbol: 'BUSD',
        decimals: 18,
        name: 'Binance USD',
        icon: ''
      },
      USDT: {
        address: '0x55d398326f99059fF775485246999027B3197955',
        symbol: 'USDT',
        decimals: 18,
        name: 'Tether USD',
        icon: ''
      },
      ETH: {
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        symbol: 'ETH',
        decimals: 18,
        name: 'Ethereum Token',
        icon: ''
      },
      BTCB: {
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        symbol: 'BTCB',
        decimals: 18,
        name: 'Bitcoin BEP2',
        icon: ''
      }
    },
    dexes: {
      PANCAKESWAP: {
        name: 'PancakeSwap',
        routerAddress: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
        factoryAddress: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
        initCodeHash: '0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5'
      },
      BISWAP: {
        name: 'BiSwap',
        routerAddress: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
        factoryAddress: '0x858E3312ed3A876947EA49d572A7C42DE08af7EE',
        initCodeHash: '0xfea293c909d87cd4153593f077b76bb7e94340200f4ee84211ae8e4f9bd7ffdf'
      }
    }
  },
  ETH: {
    id: 1,
    name: 'Ethereum',
    symbol: 'ETH',
    rpc: process.env.VITE_ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://etherscan.io',
    icon: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    tokens: {
      WETH: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        symbol: 'WETH',
        decimals: 18,
        name: 'Wrapped Ether',
        icon: ''
      },
      USDC: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        symbol: 'USDC',
        decimals: 6,
        name: 'USD Coin',
        icon: ''
      },
      USDT: {
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
        decimals: 6,
        name: 'Tether USD',
        icon: ''
      },
      WBTC: {
        address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        symbol: 'WBTC',
        decimals: 8,
        name: 'Wrapped Bitcoin',
        icon: ''
      }
    },
    dexes: {
      UNISWAP: {
        name: 'Uniswap V2',
        routerAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        factoryAddress: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
      }
    }
  }
};
