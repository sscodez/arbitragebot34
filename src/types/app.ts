import { ethers } from 'ethers';
import { Token } from './token';

export interface WalletConnectProps {
  onConnect: (data: { address: string }) => void;
  rpcUrl: string;
}

export interface WalletState {
  address: string;
  signer: ethers.Signer;
}

export interface Log {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
}

export interface SelectedPair {
  fromToken: Token;
  toToken: Token;
  fromBalance: string;
  toBalance: string;
  fromPrice: string;
  toPrice: string;
}

export interface TradingConfig {
  maxDailyTrades: number;
  minProfitPercent: number;
  maxTradeAmount: string;
  minTradeAmount: string;
  slippageTolerance: number;
}

export interface TradingStats {
  dailyTrades: number;
  lastTradeTimestamp: number;
  totalProfit: string;
  successfulTrades: number;
  failedTrades: number;
}
