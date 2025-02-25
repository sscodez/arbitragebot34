import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { SUPPORTED_CHAINS } from '@/constant/chains';
import { ArbitrageService } from '@/services/ArbitrageService';
import { TokenConfig } from '@/constant/chains';

interface ArbitrageOpportunity {
  buyDex: string;
  sellDex: string;
  profitPercent: number;
  route: string;
}

const SolanaArbitragePanel: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState({
    tokenA: SUPPORTED_CHAINS.solana.tokens.USDC,
    tokenB: SUPPORTED_CHAINS.solana.tokens.RAY,
  });

  const findOpportunities = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const arbitrageService = new ArbitrageService();
      await arbitrageService.initialize('solana', null, null); // We'll update this with proper connection later

      const opportunities = await arbitrageService.findArbitrageOpportunities(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address,
        selectedTokens.tokenA.symbol,
        selectedTokens.tokenB.symbol,
        0.5 // Min profit percentage
      );

      setOpportunities(opportunities);
    } catch (error) {
      console.error('Error finding opportunities:', error);
      setError('Failed to find arbitrage opportunities');
    } finally {
      setIsLoading(false);
    }
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const arbitrageService = new ArbitrageService();
      await arbitrageService.initialize('solana', null, null); // We'll update this with proper connection later

      const result = await arbitrageService.executeArbitrage(
        selectedTokens.tokenA.address,
        selectedTokens.tokenB.address,
        '1000000', // 1 USDC (6 decimals)
        selectedTokens.tokenA.symbol,
        selectedTokens.tokenB.symbol,
        opportunity.buyDex === 'Jupiter',
        0.5 // 0.5% slippage
      );

      console.log('Arbitrage executed:', result);
    } catch (error) {
      console.error('Error executing arbitrage:', error);
      setError('Failed to execute arbitrage');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-glow p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-primary">Solana Arbitrage</h2>
        <button
          onClick={findOpportunities}
          disabled={isLoading || !connected}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all
            ${isLoading
              ? 'bg-primary/50 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90'
            }
            text-white
          `}
        >
          {isLoading ? 'Scanning...' : 'Scan for Opportunities'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {opportunities.map((opportunity, index) => (
          <div
            key={index}
            className="p-4 bg-secondary/50 border border-border rounded-lg space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-foreground">
                  {opportunity.profitPercent.toFixed(2)}% Profit Opportunity
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {opportunity.route}
                </p>
              </div>
              <button
                onClick={() => executeArbitrage(opportunity)}
                disabled={isLoading}
                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium transition-all"
              >
                Execute
              </button>
            </div>
          </div>
        ))}

        {opportunities.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground py-8">
            No arbitrage opportunities found
          </div>
        )}
      </div>
    </div>
  );
};

export default SolanaArbitragePanel;