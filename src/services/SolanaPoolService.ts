import { Connection } from '@solana/web3.js';

export class SolanaPoolService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getPoolInfo(poolAddress: string) {
    try {
      const accountInfo = await this.connection.getAccountInfo(poolAddress);
      return accountInfo;
    } catch (error) {
      console.error('Error getting pool info:', error);
      throw error;
    }
  }

  // Add more pool-related methods as needed
}
