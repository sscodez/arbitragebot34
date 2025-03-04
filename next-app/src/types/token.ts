import { ethers } from 'ethers';

export interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
  name?: string;
  icon?: string;
}

export interface TokenPairSelectorProps {
  onPairSelect: (pairData: TokenPair) => void;
  provider: ethers.providers.Provider;
  walletAddress: string;
}

export interface TokenPair {
  tokenA: TokenInfo;
  tokenB: TokenInfo;
}

export interface TokenBalance {
  token: TokenInfo;
  amount: string;
  usdValue?: string;
}

export interface TokenPrice {
  token: TokenInfo;
  usdPrice: string;
  timestamp: number;
}

export interface TokenSelectorProps {
  onPairSelect: (pair: SelectedPair) => void;
  provider: ethers.providers.Web3Provider | null;
  walletAddress: string;
  selectedChain: string;
}

export interface SelectedPair {
  fromToken: TokenInfo;
  toToken: TokenInfo;
}

export interface TokenWithBalance extends TokenInfo {
  balance: string;
  price: string;
}
