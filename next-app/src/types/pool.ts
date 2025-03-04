import { TokenInfo } from './token';
import Big from 'big.js';

export interface RaydiumMint {
  address: string;
  symbol: string;
  decimals: number;
}

export interface RaydiumPoolResponse {
  id: string;
  name?: string;
  mintA: RaydiumMint;
  mintB: RaydiumMint;
  tokenAAmount: string;
  tokenBAmount: string;
  price: string;
  tvl: string;
  volume24h: string;
  feeRate: number;
  type?: string;
}

export interface ApiPoolResponse {
  success: boolean;
  data: {
    id: string;
    mintA: RaydiumMint;
    mintB: RaydiumMint;
    tokenA: string;
    tokenB: string;
    liquidity: string;
    day?: {
      volume: string;
    };
    feeRate?: number;
    type?: string;
  }[];
}

export interface PoolInfo {
  id: string;
  name: string;
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  price: Big;
  tvl: Big;
  volume24h: Big;
  fee: Big;
  dex: string;
}
