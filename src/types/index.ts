export interface Token {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

export interface TokenPair {
  fromToken: Token;
  toToken: Token;
}

export interface PriceUpdate {
  pair: string;
  dexA: string;  // Uniswap price
  dexB: string;  // Curve price
  dexC: string;  // PancakeSwap price
  timestamp: number;
}

export interface ArbitrageOpportunity {
  pair: string;
  buyDex: string;
  sellDex: string;
  buyPrice: string;
  sellPrice: string;
  profit: string;
  amount: string;
  route: string;
  timestamp: number;
}

export interface BotStats {
  totalProfit: string;
  dailyVolume: string;
  successRate: number;
  totalTrades: number;
  successfulTrades: number;
}

export interface BotConfig {
  minProfitThreshold: number;
  maxTradeAmount: number;
  slippage: number;
  gasLimit: number;
}

export interface BotStatus {
  isRunning: boolean;
  address: string;
  uptime: number;
  stats: BotStats;
  config: BotConfig;
}

export interface TradeHistoryEntry {
  timestamp: number;
  pair: string;
  profit: string;
  amount: string;
  status: string;
  hash?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface Log {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: string;
}

export interface WalletState {
  address: string;
  signer: any;
}

export interface SelectedPair {
  fromToken: Token;
  toToken: Token;
  fromPrice?: string;
  toPrice?: string;
}
