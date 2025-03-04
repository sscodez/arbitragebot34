import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SelectedPair } from '@/types/app';
import { TokenInfo } from '@/types/token';
import poolIds from '@/constant/poolids.json';

interface TokenPairSelectorProps {
  chain: string;
  onSelect: (pair: SelectedPair) => void;
  selectedPair: SelectedPair | null;
}

const TokenPairSelector: React.FC<TokenPairSelectorProps> = ({
  chain,
  onSelect,
  selectedPair,
}) => {
  const [fromToken, setFromToken] = useState<TokenInfo | null>(null);
  const [toToken, setToToken] = useState<TokenInfo | null>(null);

  // Get all configured tokens from poolids.json
  const configuredTokens = useMemo(() => {
    console.log('[TokenSelector] Reading configured tokens from poolids.json');
    const tokenMap = new Map<string, TokenInfo>();

    poolIds.pairs.forEach(pair => {
      // Add tokenA
      if (!tokenMap.has(pair.tokenA)) {
        const [tokenASymbol] = pair.pair.split('-'); // e.g., "WSOL-USDT" -> "WSOL"
        const displaySymbol = tokenASymbol === 'WSOL' ? 'SOL' : tokenASymbol;
        tokenMap.set(pair.tokenA, {
          address: pair.tokenA,
          symbol: displaySymbol,
          name: displaySymbol,
          decimals: tokenASymbol === 'WSOL' || tokenASymbol === 'SOL' ? 9 : 6
        });
      }

      // Add tokenB
      if (!tokenMap.has(pair.tokenB)) {
        const [, tokenBSymbol] = pair.pair.split('-'); // e.g., "WSOL-USDT" -> "USDT"
        tokenMap.set(pair.tokenB, {
          address: pair.tokenB,
          symbol: tokenBSymbol,
          name: tokenBSymbol,
          decimals: tokenBSymbol === 'WSOL' || tokenBSymbol === 'SOL' ? 9 : 6
        });
      }
    });

    const tokens = Array.from(tokenMap.values());
    console.log('[TokenSelector] Configured tokens:', tokens);
    return tokens;
  }, []);

  // Initialize state from selectedPair prop
  useEffect(() => {
    if (selectedPair) {
      const fromToken = configuredTokens.find(t => t.address === selectedPair.fromToken.address);
      const toToken = configuredTokens.find(t => t.address === selectedPair.toToken.address);
      if (fromToken && toToken) {
        setFromToken(fromToken);
        setToToken(toToken);
      }
    }
  }, [selectedPair, configuredTokens]);

  // Get available 'to' tokens based on selected 'from' token
  const availableToTokens = useMemo(() => {
    if (!fromToken) return [];

    console.log('[TokenSelector] Finding available pairs for:', fromToken.symbol);
    const pairs = poolIds.pairs.filter(pair => 
      pair.tokenA === fromToken.address || pair.tokenB === fromToken.address
    );

    const toTokens = pairs.map(pair => {
      const otherTokenAddress = pair.tokenA === fromToken.address ? pair.tokenB : pair.tokenA;
      return configuredTokens.find(t => t.address === otherTokenAddress);
    }).filter((t): t is TokenInfo => t !== undefined);

    console.log('[TokenSelector] Available to tokens:', toTokens);
    return toTokens;
  }, [fromToken, configuredTokens]);

  const handleFromTokenSelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const token = configuredTokens.find(t => t.symbol === event.target.value) || null;
    console.log('[TokenSelector] Selected from token:', token);
    setFromToken(token);
    setToToken(null); // Reset to token when from token changes
  }, [configuredTokens]);

  const handleToTokenSelect = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const token = configuredTokens.find(t => t.symbol === event.target.value) || null;
    console.log('[TokenSelector] Selected to token:', token);
    setToToken(token);

    // If we have both tokens, find the pool IDs
    if (fromToken && token) {
      const pair = poolIds.pairs.find(p => 
        (p.tokenA === fromToken.address && p.tokenB === token.address) ||
        (p.tokenA === token.address && p.tokenB === fromToken.address)
      );

      if (pair) {
        console.log('[TokenSelector] Found pair:', pair);
        onSelect({
          fromToken,
          toToken: token,
          poolId: pair.pooldids[0], // Use first pool as default
          allPoolIds: pair.pooldids
        });
      }
    }
  }, [fromToken, configuredTokens, onSelect]);

  return (
    <div className="flex flex-col gap-4 p-4 border border-gray-700 rounded-lg bg-gray-900">
      <div className="flex flex-col gap-2">
        <label className="flex flex-col text-white">
          From Token:
          <select 
            value={fromToken?.symbol || ''} 
            onChange={handleFromTokenSelect}
            className="p-2 mt-1 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select token</option>
            {configuredTokens.map(token => (
              <option key={token.address} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col text-white">
          To Token:
          <select 
            value={toToken?.symbol || ''} 
            onChange={handleToTokenSelect}
            className="p-2 mt-1 rounded bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!fromToken}
          >
            <option value="">Select token</option>
            {availableToTokens.map(token => (
              <option key={token.address} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedPair && (
        <div className="mt-4 p-2 bg-gray-800 rounded border border-gray-700">
          <p className="text-white">Selected Pair: {selectedPair.fromToken.symbol}/{selectedPair.toToken.symbol}</p>
          <p className="text-sm text-gray-400">Pool ID: {selectedPair.poolId}</p>
          <p className="text-sm text-gray-400">Total Pools: {selectedPair.allPoolIds.length}</p>
        </div>
      )}
    </div>
  );
};

export default TokenPairSelector;
