export const CHAINS = {
  BSC: {
    id: 56,
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorer: 'https://bscscan.com',
    icon: '🟡',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
  },
  POLYGON: {
    id: 137,
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    icon: '🟣',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  ARBITRUM: {
    id: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    icon: '🔵',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  AVALANCHE: {
    id: 43114,
    name: 'Avalanche',
    symbol: 'AVAX',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    blockExplorer: 'https://snowtrace.io',
    icon: '🔴',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18,
    },
  },
};

export const DEXES = {
  BSC: {
    PANCAKESWAP: {
      name: 'PancakeSwap',
      factory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
      router: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      icon: '🥞',
    },
    BISWAP: {
      name: 'Biswap',
      factory: '0x858E3312ed3A876947EA49d572A7C42DE08af7EE',
      router: '0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8',
      icon: '🔄',
    },
  },
  POLYGON: {
    QUICKSWAP: {
      name: 'QuickSwap',
      factory: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32',
      router: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff',
      icon: '⚡',
    },
    SUSHISWAP: {
      name: 'SushiSwap',
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      icon: '🍣',
    },
  },
  ARBITRUM: {
    SUSHISWAP: {
      name: 'SushiSwap',
      factory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4',
      router: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
      icon: '🍣',
    },
    CAMELOT: {
      name: 'Camelot',
      factory: '0x6EcCab422D763aC031210895C81787E87B43A652',
      router: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d',
      icon: '⚔️',
    },
  },
  AVALANCHE: {
    TRADERJOE: {
      name: 'Trader Joe',
      factory: '0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10',
      router: '0x60aE616a2155Ee3d9A68541Ba4544862310933d4',
      icon: '☕',
    },
    PANGOLIN: {
      name: 'Pangolin',
      factory: '0xefa94DE7a4656D787667C749f7E1223D71E9FD88',
      router: '0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106',
      icon: '🐼',
    },
  },
};
