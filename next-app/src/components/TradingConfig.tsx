import React, { useState } from 'react';
import { TradingConfigProps } from '@/types/app';

const TradingConfig: React.FC<TradingConfigProps> = ({ config, onConfigChange }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field: keyof typeof config, value: string | number) => {
    const newConfig = {
      ...localConfig,
      [field]: typeof config[field] === 'number' ? Number(value) : value,
    };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Daily Trades
          </label>
          <input
            type="number"
            value={localConfig.maxDailyTrades}
            onChange={(e) => handleChange('maxDailyTrades', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            min="1"
            max="1000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Min Profit Percent
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              value={localConfig.minProfitPercent}
              onChange={(e) => handleChange('minProfitPercent', e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              step="0.1"
              min="0.1"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Trade Amount
          </label>
          <input
            type="text"
            value={localConfig.maxTradeAmount}
            onChange={(e) => handleChange('maxTradeAmount', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Slippage Tolerance
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="number"
              value={localConfig.slippageTolerance}
              onChange={(e) => handleChange('slippageTolerance', e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-3 pr-12 focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              step="0.1"
              min="0.1"
              max="5"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm">%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingConfig;
