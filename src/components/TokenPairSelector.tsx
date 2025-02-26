import React, { useState, useMemo, useCallback } from 'react';
import { TokenPairSelectorProps, SelectedPair } from '@/types/app';
import { SUPPORTED_CHAINS } from '@/constant/chains';

const TokenPairSelector: React.FC<TokenPairSelectorProps> = ({
  chain,
  selectedPair,
  onPairSelect,
}) => {
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string>('');
  const [toTokenSymbol, setToTokenSymbol] = useState<string>('');
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const chainTokens = useMemo(() => {
    const chainConfig = SUPPORTED_CHAINS[chain];
    if (!chainConfig) return [];
    return Object.entries(chainConfig.tokens).map(([symbol, token]) => ({
      symbol,
      ...token,
    }));
  }, [chain]);

  const filteredFromTokens = useMemo(() => {
    return chainTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchFrom.toLowerCase())
    );
  }, [chainTokens, searchFrom]);

  const filteredToTokens = useMemo(() => {
    return chainTokens.filter(token =>
      token.symbol.toLowerCase().includes(searchTo.toLowerCase()) &&
      token.symbol !== fromTokenSymbol
    );
  }, [chainTokens, searchTo, fromTokenSymbol]);

  const handleFromTokenSelect = useCallback((token: any) => {
    console.log('[TokenPairSelector] From token selected:', token);
    setFromTokenSymbol(token.symbol);
    setShowFromDropdown(false);
    const toToken = chainTokens.find(t => t.symbol === toTokenSymbol);
    
    if (toToken) {
      console.log('[TokenPairSelector] Pair selected:', {
        fromToken: token,
        toToken
      });
      onPairSelect({
        fromToken: token,
        toToken,
        fromBalance: '0',
        toBalance: '0',
        fromPrice: '0',
        toPrice: '0'
      });
    }
  }, [chainTokens, toTokenSymbol, onPairSelect]);

  const handleToTokenSelect = useCallback((token: any) => {
    console.log('[TokenPairSelector] To token selected:', token);
    setToTokenSymbol(token.symbol);
    setShowToDropdown(false);
    const fromToken = chainTokens.find(t => t.symbol === fromTokenSymbol);
    
    if (fromToken) {
      console.log('[TokenPairSelector] Pair selected:', {
        fromToken,
        toToken: token
      });
      onPairSelect({
        fromToken,
        toToken: token,
        fromBalance: '0',
        toBalance: '0',
        fromPrice: '0',
        toPrice: '0'
      });
    }
  }, [chainTokens, fromTokenSymbol, onPairSelect]);

  const swapTokens = useCallback(() => {
    console.log('[TokenPairSelector] Swapping tokens');
    if (fromTokenSymbol && toTokenSymbol) {
      const fromToken = chainTokens.find(t => t.symbol === toTokenSymbol);
      const toToken = chainTokens.find(t => t.symbol === fromTokenSymbol);
      setFromTokenSymbol(toTokenSymbol);
      setToTokenSymbol(fromTokenSymbol);
      
      if (fromToken && toToken) {
        console.log('[TokenPairSelector] Pair swapped:', {
          fromToken,
          toToken
        });
        onPairSelect({
          fromToken,
          toToken,
          fromBalance: '0',
          toBalance: '0',
          fromPrice: '0',
          toPrice: '0'
        });
      }
    }
  }, [chainTokens, fromTokenSymbol, toTokenSymbol, onPairSelect]);

  return (
    <div className="space-y-6 bg-card rounded-lg p-6 border border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-primary">Select Token Pair</h2>
        {selectedPair && (
          <button
            onClick={swapTokens}
            className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            title="Swap tokens"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="grid gap-8">
        {/* From Token */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">From Token</label>
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer border border-border hover:border-primary transition-colors"
              onClick={() => setShowFromDropdown(!showFromDropdown)}
            >
              {fromTokenSymbol ? (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{fromTokenSymbol}</span>
                  {selectedPair && (
                    <span className="text-sm text-gray-400">
                      Balance: {selectedPair.fromBalance}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">Select token</span>
              )}
              <svg
                className={`w-5 h-5 transition-transform ${showFromDropdown ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showFromDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-card rounded-lg border border-border shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchFrom}
                    onChange={(e) => setSearchFrom(e.target.value)}
                    className="w-full p-2 bg-secondary/50 rounded border border-border focus:border-primary"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredFromTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleFromTokenSelect(token)}
                      className={`w-full p-3 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between ${
                        fromTokenSymbol === token.symbol ? 'bg-secondary/30' : ''
                      }`}
                    >
                      <span className="font-medium">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* To Token */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">To Token</label>
          <div className="relative">
            <div
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer border border-border hover:border-primary transition-colors"
              onClick={() => setShowToDropdown(!showToDropdown)}
            >
              {toTokenSymbol ? (
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{toTokenSymbol}</span>
                  {selectedPair && (
                    <span className="text-sm text-gray-400">
                      Balance: {selectedPair.toBalance}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">Select token</span>
              )}
              <svg
                className={`w-5 h-5 transition-transform ${showToDropdown ? 'transform rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {showToDropdown && (
              <div className="absolute z-10 w-full mt-2 bg-card rounded-lg border border-border shadow-lg">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Search tokens..."
                    value={searchTo}
                    onChange={(e) => setSearchTo(e.target.value)}
                    className="w-full p-2 bg-secondary/50 rounded border border-border focus:border-primary"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredToTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => handleToTokenSelect(token)}
                      disabled={token.symbol === fromTokenSymbol}
                      className={`w-full p-3 text-left hover:bg-secondary/50 transition-colors flex items-center justify-between ${
                        toTokenSymbol === token.symbol ? 'bg-secondary/30' : ''
                      } ${token.symbol === fromTokenSymbol ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="font-medium">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPair && (
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Selected Pair Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm text-gray-400">From</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{selectedPair.fromToken.symbol}</span>
                  <span className="text-sm text-gray-400">
                    Balance: {selectedPair.fromBalance}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-sm text-gray-400">Price</span>
                <div className="font-medium">${selectedPair.fromPrice}</div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <span className="text-sm text-gray-400">To</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{selectedPair.toToken.symbol}</span>
                  <span className="text-sm text-gray-400">
                    Balance: {selectedPair.toBalance}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className="text-sm text-gray-400">Price</span>
                <div className="font-medium">${selectedPair.toPrice}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPairSelector;
