import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export class SolanaTokenService {
  private connection: Connection;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  async getTokenBalance(tokenAddress: string, walletAddress: string) {
    try {
      const tokenPublicKey = new PublicKey(tokenAddress);
      const walletPublicKey = new PublicKey(walletAddress);

      const tokenAccounts = await this.connection.getTokenAccountsByOwner(
        walletPublicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      for (const { account, pubkey } of tokenAccounts.value) {
        if (account.owner.equals(tokenPublicKey)) {
          return account.data.parsed.info.tokenAmount.amount;
        }
      }

      return '0';
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  // Add more token-related methods as needed
}
