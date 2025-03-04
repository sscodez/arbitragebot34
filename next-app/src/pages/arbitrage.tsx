import { useEffect, useState } from 'react';
import { Connection } from '@solana/web3.js';
import { RaydiumService } from '../services/raydium';
import ArbitrageOpportunities from '../components/ArbitrageOpportunities';

const ArbitragePage = () => {
  const [raydiumService, setRaydiumService] = useState<RaydiumService | null>(null);

  useEffect(() => {
    // Initialize Raydium service
    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const service = new RaydiumService(connection);
    setRaydiumService(service);
  }, []);

  if (!raydiumService) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Raydium Arbitrage Scanner</h1>
          <p className="mt-2 text-lg text-gray-600">
            Monitoring {poolIds.pairs.length} pairs for arbitrage opportunities
          </p>
        </div>

        <ArbitrageOpportunities raydiumService={raydiumService} />
      </div>
    </div>
  );
};

export default ArbitragePage;
