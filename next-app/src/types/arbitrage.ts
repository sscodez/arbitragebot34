import { TokenInfo } from './token';
import Big from 'big.js';

export interface ArbitrageOpportunity {
  buyPool: {
    poolId: string;
    price: Big;
    liquidity: Big;
    name: string;
  };
  sellPool: {
    poolId: string;
    price: Big;
    liquidity: Big;
    name: string;
  };
  tokenA: TokenInfo;
  tokenB: TokenInfo;
  profitPercent: Big;
  profit: Big;
  timestamp: number;
  estimatedGas: Big;
  confidence: number;
}
