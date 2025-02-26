import { ethers } from 'ethers';
import { Token } from './token';

export interface Log {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: number;
  data?: any;
  source?: string;
  level?: 'low' | 'medium' | 'high';
  txHash?: string;
  metadata?: {
    chain?: string;
    pair?: string;
    amount?: string;
    gas?: string;
    [key: string]: any;
  };
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
  slippageTolerance: number;
}

export interface BotStatus {
  isRunning: boolean;
  address: string;
  balance: string;
}

export interface Trade {
  timestamp: number;
  pair: string;
  profit: string;
  route: string;
  status: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
}

export interface TokenPairSelectorProps {
  chain: string;
  selectedPair: SelectedPair | null;
  onPairSelect: (pair: SelectedPair) => void;
}

export interface BotControlProps {
  status: BotStatus;
  onStart: () => void;
  onStop: () => void;
  onToggleExecution: () => void;
  isExecutionEnabled: boolean;
}

export interface TradingConfigProps {
  config: TradingConfig;
  onConfigChange: (config: TradingConfig) => void;
}

export interface PriceChartProps {
  prices: any[];
  pair: SelectedPair | null;
}

export interface TradeHistoryProps {
  trades: Trade[];
}

export interface LogViewerProps {
  logs: Log[];
}

export interface PhantomWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  selectedChain: string;
  onChainChange: (chain: string) => void;
}
