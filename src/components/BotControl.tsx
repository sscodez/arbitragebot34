import React from 'react';
import { BotControlProps } from '@/types/app';

const BotControl: React.FC<BotControlProps> = ({
  status,
  onStart,
  onStop,
  onToggleExecution,
  isExecutionEnabled,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Bot Status</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              status.isRunning
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {status.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>

        {status.address && (
          <div className="text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>Bot Address:</span>
              <span className="font-mono">
                {status.address.slice(0, 6)}...{status.address.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Balance:</span>
              <span>{status.balance}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        <button
          onClick={status.isRunning ? onStop : onStart}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            status.isRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {status.isRunning ? 'Stop Bot' : 'Start Bot'}
        </button>

        <button
          onClick={onToggleExecution}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
            isExecutionEnabled
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-gray-500 hover:bg-gray-600 text-white'
          }`}
        >
          {isExecutionEnabled ? 'Disable Execution' : 'Enable Execution'}
        </button>
      </div>
    </div>
  );
};

export default BotControl;
