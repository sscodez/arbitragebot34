import React from 'react';
import { TradingConfigProps } from '@/types/app';

const TradingConfig: React.FC<TradingConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const handleChange = (field: keyof typeof config, value: string | number) => {
    onConfigChange({
      ...config,
      [field]: typeof config[field] === 'number' ? Number(value) : value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Risk Tolerance */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-muted-foreground">Risk Tolerance</label>
          <span className="text-sm text-muted-foreground">Balanced</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value="50"
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Conservative</span>
          <span>Aggressive</span>
        </div>
      </div>

      {/* Stop Loss */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-muted-foreground">Stop Loss</label>
          <span className="text-sm text-muted-foreground">Current: 15%</span>
        </div>
        <input
          type="range"
          min="5"
          max="25"
          value="15"
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex items-center mt-1">
          <div className="flex-1">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-primary rounded border-border bg-secondary"
              />
              <span className="ml-2 text-sm text-muted-foreground">Auto-adjust</span>
            </label>
          </div>
        </div>
      </div>

      {/* Position Size Limit */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-muted-foreground">Position Size Limit</label>
          <span className="text-sm text-muted-foreground">Max: 30% of portfolio</span>
        </div>
        <input
          type="range"
          min="10"
          max="50"
          value="30"
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Leverage Limit */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm text-muted-foreground">Leverage Limit</label>
          <span className="text-sm text-muted-foreground">Current: 2x</span>
        </div>
        <input
          type="range"
          min="1"
          max="5"
          value="2"
          step="0.5"
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Set Alerts Button */}
      <button
        className="w-full px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors"
      >
        Set Alerts
      </button>
    </div>
  );
};

export default TradingConfig;
