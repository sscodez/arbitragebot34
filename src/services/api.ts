import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ArbitrageConfig {
  privateKey: string;
  slippage: number;
  gasLimit: number;
}

export interface TokenPair {
  fromToken: string;
  toToken: string;
}

const api = {
  startBot: async (config: ArbitrageConfig) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bot/start`, config);
      return response.data;
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  },

  stopBot: async (address: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/bot/stop`, { address });
      return response.data;
    } catch (error) {
      console.error('Failed to stop bot:', error);
      throw error;
    }
  },

  getTokenPrice: async (tokenAddress: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/token/price/${tokenAddress}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get token price:', error);
      throw error;
    }
  },

  getProfitableRoutes: async (tokenPair: TokenPair) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/routes/profitable`, tokenPair);
      return response.data;
    } catch (error) {
      console.error('Failed to get profitable routes:', error);
      throw error;
    }
  },

  getGasPrice: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/network/gas-price`);
      return response.data;
    } catch (error) {
      console.error('Failed to get gas price:', error);
      throw error;
    }
  }
};

export default api;
