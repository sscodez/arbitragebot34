import React from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

function TradingPairCard({ pair, stats }) {
  const {
    profit = 0,
    priceA = 0,
    priceB = 0,
    trades = 0,
    successRate = 0
  } = stats;

  const isProfitable = parseFloat(profit) >= 0;

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-4 hover:border-primary-500/50 transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{pair.name}</h3>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
          isProfitable ? 'bg-primary-500/10 text-primary-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isProfitable ? (
            <ArrowTrendingUpIcon className="h-4 w-4" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4" />
          )}
          <span>{parseFloat(profit).toFixed(2)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-sm text-dark-text/60 mb-1">Price A</div>
          <div className="font-mono text-primary-400">
            ${parseFloat(priceA).toFixed(6)}
          </div>
        </div>

        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-sm text-dark-text/60 mb-1">Price B</div>
          <div className="font-mono text-primary-400">
            ${parseFloat(priceB).toFixed(6)}
          </div>
        </div>

        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-sm text-dark-text/60 mb-1">24h Trades</div>
          <div className="font-mono">{trades}</div>
        </div>

        <div className="bg-dark-bg rounded-lg p-3">
          <div className="text-sm text-dark-text/60 mb-1">Success Rate</div>
          <div className="font-mono">{successRate}%</div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-dark-border">
        <div className="flex justify-between items-center text-sm">
          <span className="text-dark-text/60">Min Profit</span>
          <span className="font-mono text-primary-400">{pair.minProfit}%</span>
        </div>
      </div>
    </div>
  );
}

export default TradingPairCard;
