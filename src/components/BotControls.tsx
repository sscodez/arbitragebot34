import React from 'react';
import { PlayIcon, StopIcon } from '@heroicons/react/24/solid';
import { TRADING_PAIRS } from '../constant/constant';

function BotControls({ status, onStart, onStop, stats, tradingPairs }) {
  return (
    <div className="bg-dark-card rounded-lg border border-dark-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-primary-400">Bot Controls</h2>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            status === 'running' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {status === 'running' ? 'Running' : 'Stopped'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <div className="text-sm text-dark-text/60 mb-1">Total Profit</div>
          <div className="text-xl font-semibold text-primary-400">
            ${stats.totalProfit}
          </div>
        </div>
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <div className="text-sm text-dark-text/60 mb-1">Daily Volume</div>
          <div className="text-xl font-semibold text-primary-400">
            ${stats.dailyVolume}
          </div>
        </div>
        <div className="bg-dark-bg/50 rounded-lg p-4">
          <div className="text-sm text-dark-text/60 mb-1">Success Rate</div>
          <div className="text-xl font-semibold text-primary-400">
            {stats.successRate}%
          </div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-medium text-dark-text">Trading Pairs</h3>
        <div className="grid gap-4">
          {TRADING_PAIRS.map((pair) => {
            const pairData = tradingPairs[pair.name] || {
              priceA: '0.00',
              priceB: '0.00',
              profit: '0.00'
            };
            
            return (
              <div 
                key={pair.name}
                className="bg-dark-bg/50 rounded-lg p-4 border border-dark-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-dark-text">{pair.name}</span>
                  <span className={`text-sm ${
                    parseFloat(pairData.profit) > 0 
                      ? 'text-green-400' 
                      : 'text-dark-text/60'
                  }`}>
                    Profit: {pairData.profit}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-text/60">DEX A: </span>
                    <span className="font-mono">${pairData.priceA}</span>
                  </div>
                  <div>
                    <span className="text-dark-text/60">DEX B: </span>
                    <span className="font-mono">${pairData.priceB}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onStart}
          disabled={status === 'running'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
            status === 'running'
              ? 'bg-primary-400/20 text-primary-400/60 cursor-not-allowed'
              : 'bg-primary-400 text-white hover:bg-primary-500 transition-colors'
          }`}
        >
          <PlayIcon className="w-5 h-5" />
          Start Bot
        </button>
        <button
          onClick={onStop}
          disabled={status !== 'running'}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium ${
            status !== 'running'
              ? 'bg-red-500/20 text-red-500/60 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600 transition-colors'
          }`}
        >
          <StopIcon className="w-5 h-5" />
          Stop Bot
        </button>
      </div>
    </div>
  );
}

export default BotControls;
