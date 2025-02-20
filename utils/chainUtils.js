import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, CHAIN_SETTINGS, ARBITRAGE_CONFIG } from '../constant/chains.js';

class ChainManager {
    constructor() {
        this.providers = {};
        this.wallets = {};
        this.currentChain = null;
    }

    async initializeChain(chainId, privateKey) {
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
        if (!chain) {
            throw new Error(`Chain ID ${chainId} not supported`);
        }

        if (!this.providers[chainId]) {
            this.providers[chainId] = new ethers.providers.JsonRpcProvider(chain.rpc);
        }

        if (privateKey) {
            this.wallets[chainId] = new ethers.Wallet(privateKey, this.providers[chainId]);
        }

        this.currentChain = chain;
        return chain;
    }

    async getGasPrice(chainId) {
        const provider = this.providers[chainId];
        const settings = CHAIN_SETTINGS[this.currentChain.name];
        
        try {
            const feeData = await provider.getFeeData();
            const gasPrice = feeData.gasPrice.mul(settings.gasMultiplier);
            const maxGasPrice = ethers.utils.parseUnits(settings.maxGasPrice, 'gwei');
            
            return gasPrice.gt(maxGasPrice) ? maxGasPrice : gasPrice;
        } catch (error) {
            console.error('Error getting gas price:', error);
            return ethers.utils.parseUnits('5', 'gwei'); // fallback
        }
    }

    getDexes(chainId) {
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
        return chain ? chain.dexes : {};
    }

    getArbitrageConfig(chainId) {
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
        return chain ? ARBITRAGE_CONFIG[chain.name] : null;
    }

    async isContractValid(chainId, address) {
        try {
            const provider = this.providers[chainId];
            const code = await provider.getCode(address);
            return code !== '0x';
        } catch {
            return false;
        }
    }

    async getOptimalGasLimit(chainId, estimatedGas) {
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
        if (!chain) return estimatedGas;

        const settings = CHAIN_SETTINGS[chain.name];
        return Math.floor(estimatedGas * settings.gasMultiplier);
    }

    async waitForConfirmations(chainId, txHash, confirmations = null) {
        const provider = this.providers[chainId];
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);
        const requiredConfirmations = confirmations || CHAIN_SETTINGS[chain.name].confirmations;

        try {
            const receipt = await provider.waitForTransaction(txHash, requiredConfirmations);
            return receipt.status === 1;
        } catch (error) {
            console.error('Error waiting for confirmations:', error);
            return false;
        }
    }

    getProvider(chainId) {
        return this.providers[chainId];
    }

    getWallet(chainId) {
        return this.wallets[chainId];
    }

    getCurrentChain() {
        return this.currentChain;
    }
}

export const chainManager = new ChainManager();
