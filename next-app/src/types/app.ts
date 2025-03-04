import { ethers } from 'ethers';
import { Token } from './token';

export interface Log {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: number;
  metadata?: any;
  source: string;
}

export interface BotStatus {
  isRunning: boolean;
  address: string;
  balance: string;
}

export interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

export interface SelectedPair {
  fromToken: Token;
  toToken: Token;
  poolId: string;
  allPoolIds: string[];
}

export interface TradingConfig {
  riskTolerance: number; // 0-100
  stopLoss: number; // percentage
  autoAdjustStopLoss: boolean;
  positionSizeLimit: number; // percentage of portfolio
  leverageLimit: number; // multiplier
  alerts: {
    priceChange: boolean;
    stopLoss: boolean;
    profitTarget: boolean;
  };
  maxDailyTrades: number;
  minProfitPercent: number;
  maxTradeAmount: string;
  slippageTolerance: number;
}

export interface ArbitrageOpportunity {
  fromToken: Token;
  toToken: Token;
  profitPercent: number;
  expectedProfit: string;
  route: string[];
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
  botStatus: BotStatus;
  walletConnected: boolean;
}

export interface PhantomWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  selectedChain: string;
  onChainChange: (chain: string) => void;
}
