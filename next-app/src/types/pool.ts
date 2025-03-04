import { TokenInfo } from './token';
import Big from 'big.js';

export interface RaydiumMint {
  address: string;
  symbol: string;
  decimals: number;
}

export interface RaydiumPoolResponse {
  id: string;
  name: string;
  mintA: {
    address: string;
    symbol: string;
    decimals: number;
  };
  mintB: {
    address: string;
    symbol: string;
    decimals: number;
  };
  tokenAAmount: string;
  tokenBAmount: string;
  tvl: string;
  volume24h: string;
  price: string;
  feeRate: number;
  type: string;
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
  price: string;
  tvl: string;
  volume24h: string;
  feeRate: number;
  type: string;
  tokenAAmount: string;
  tokenBAmount: string;
}
