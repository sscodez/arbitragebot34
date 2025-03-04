import React, { useEffect, useState } from 'react';
import { ArbitrageOpportunity } from '../services/raydium';

interface Props {
  raydiumService: any; // Replace with proper type
}

const ArbitrageOpportunities: React.FC<Props> = ({ raydiumService }) => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);

  useEffect(() => {
    // Subscribe to arbitrage opportunities
    raydiumService.onArbitrageOpportunity((newOpportunities: ArbitrageOpportunity[]) => {
      setOpportunities(newOpportunities);
    });
  }, [raydiumService]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Arbitrage Opportunities</h2>
      {opportunities.length === 0 ? (
        <p className="text-gray-500">No arbitrage opportunities found</p>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                  {opp.pool1.tokenA.symbol}/{opp.pool1.tokenB.symbol} ↔️ {opp.pool2.tokenA.symbol}/{opp.pool2.tokenB.symbol}
                </h3>
                <span className="text-green-600 font-bold">
                  {opp.profitPotential.toFixed(2)}% Potential
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Pool 1</h4>
                  <p>Price: ${opp.pool1.price.toFixed(6)}</p>
                  <p>TVL: ${opp.pool1.tvl.toLocaleString()}</p>
                  <p>24h Volume: ${opp.pool1.volume24h.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium">Pool 2</h4>
                  <p>Price: ${opp.pool2.price.toFixed(6)}</p>
                  <p>TVL: ${opp.pool2.tvl.toLocaleString()}</p>
                  <p>24h Volume: ${opp.pool2.volume24h.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Last updated: {new Date(opp.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArbitrageOpportunities;
