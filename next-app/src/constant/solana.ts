import { PublicKey } from '@solana/web3.js';

export const Raydium = {
  name: 'Raydium',
  programId: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
};

export const Jupiter = {
  name: 'Jupiter',
  apiUrl: 'https://quote-api.jup.ag/v6',
  defaultSlippageBps: 50, // 0.5%
};

// Mainnet RPC endpoints
export const SolanaEndpoints = {
  mainnet: {
    http: 'https://api.mainnet-beta.solana.com',
    ws: 'wss://api.mainnet-beta.solana.com',
  },
  devnet: {
    http: 'https://api.devnet.solana.com',
    ws: 'wss://api.devnet.solana.com',
  },
};
