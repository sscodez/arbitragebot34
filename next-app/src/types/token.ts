import { ethers } from 'ethers';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

export interface TokenPairSelectorProps {
  onPairSelect: (pairData: TokenPairData) => void;
  provider: ethers.providers.Provider;
  walletAddress: string;
}

export interface TokenPairData {
  fromToken: Token;
  toToken: Token;
  fromBalance: string;
  toBalance: string;
  fromPrice: string;
  toPrice: string;
}

export interface TokenBalances {
  [key: string]: string;
}

export interface TokenPrices {
  [key: string]: string;
}

export interface TokenSelectorProps {
  onPairSelect: (pair: SelectedPair) => void;
  provider: ethers.providers.Web3Provider | null;
  walletAddress: string;
  selectedChain: string;
}

export interface SelectedPair {
  fromToken: Token;
  toToken: Token;
}

export interface TokenWithBalance extends Token {
  balance: string;
  price: string;
}
