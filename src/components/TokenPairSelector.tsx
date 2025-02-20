import React, { useState } from 'react';
import { ethers } from 'ethers';
import { TokenSelectorProps, Token, SelectedPair } from '../types/token';

const TokenPairSelector: React.FC<TokenSelectorProps> = ({ onPairSelect, provider, walletAddress }) => {
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);

  const handleFromTokenSelect = (token: Token) => {
    setFromToken(token);
    if (toToken) {
      onPairSelect({ fromToken: token, toToken });
    }
  };

  const handleToTokenSelect = (token: Token) => {
    setToToken(token);
    if (fromToken) {
      onPairSelect({ fromToken, toToken: token });
    }
  };

  // Mock tokens for demonstration
  const availableTokens: Token[] = [
    { symbol: 'ETH', address: '0x...', decimals: 18 },
    { symbol: 'USDT', address: '0x...', decimals: 6 },
    { symbol: 'USDC', address: '0x...', decimals: 6 },
    { symbol: 'DAI', address: '0x...', decimals: 18 },
  ];

  return (
    <div className="space-y-4">
      {/* From Token */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">From Token</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {availableTokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => handleFromTokenSelect(token)}
              className={`p-3 rounded-lg border transition-all ${
                fromToken?.symbol === token.symbol
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-secondary'
              }`}
            >
              {token.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* To Token */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-muted-foreground">To Token</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {availableTokens.map((token) => (
            <button
              key={token.symbol}
              onClick={() => handleToTokenSelect(token)}
              disabled={fromToken?.symbol === token.symbol}
              className={`p-3 rounded-lg border transition-all ${
                toToken?.symbol === token.symbol
                  ? 'border-primary bg-primary/10 text-primary'
                  : fromToken?.symbol === token.symbol
                  ? 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                  : 'border-border hover:border-primary/50 hover:bg-secondary'
              }`}
            >
              {token.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Pair Display */}
      {fromToken && toToken && (
        <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border">
          <h3 className="text-sm font-medium text-primary mb-2">Selected Pair</h3>
          <div className="flex items-center justify-center space-x-4">
            <span className="text-lg font-semibold">{fromToken.symbol}</span>
            <span className="text-primary">→</span>
            <span className="text-lg font-semibold">{toToken.symbol}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPairSelector;
