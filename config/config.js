require('dotenv').config();

const config = {
    network: {
        eth: {
            network: process.env.ETH_NETWORK || 'mainnet',
            rpcUrl: process.env.RPC_URL,
            wsUrl: process.env.WS_URL
        }
    },
    wallet: {
        privateKey: process.env.PRIVATE_KEY,
        publicKey: process.env.PUBLIC_KEY
    },
    contracts: {
        uniswapRouter: process.env.UNISWAP_ROUTER,
        sushiswapRouter: process.env.SUSHISWAP_ROUTER
    },
    gas: {
        maxGasPrice: parseInt(process.env.MAX_GAS_PRICE) || 100,
        gasLimit: parseInt(process.env.GAS_LIMIT) || 500000
    },
    trading: {
        minProfitUsd: parseFloat(process.env.MIN_PROFIT_USD) || 50,
        slippageTolerance: parseFloat(process.env.SLIPPAGE_TOLERANCE) || 0.5
    },
    api: {
        etherscan: process.env.ETHERSCAN_API_KEY,
        alchemy: process.env.ALCHEMY_API_KEY
    },
    server: {
        port: parseInt(process.env.PORT) || 3000,
        nodeEnv: process.env.NODE_ENV || 'development'
    }
};

module.exports = config;
