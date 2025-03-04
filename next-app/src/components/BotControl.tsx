import React from 'react';
import { BotControlProps } from '@/types/app';

const BotControl: React.FC<BotControlProps> = ({
  status,
  onStart,
  onStop,
  onToggleExecution,
  isExecutionEnabled
}) => {
  const isRunning = status.isRunning;
  const walletConnected = !!status.address;

  const handleStartClick = async () => {
    console.log('[BotControl] Start button clicked:', {
      isRunning,
      walletConnected
    });
    
    if (!walletConnected) {
      console.log('[BotControl] Cannot start: wallet not connected');
      return;
    }
    
    if (isRunning) {
      console.log('[BotControl] Cannot start: already running');
      return;
    }
    
    try {
      console.log('[BotControl] Starting bot...');
      await onStart();
      console.log('[BotControl] Bot started successfully');
    } catch (error) {
      // console.error('[BotControl] Failed to start bot:', error);
    }
  };

  const handleStopClick = () => {
    console.log('[BotControl] Stop button clicked:', {
      isRunning
    });
    
    if (!isRunning) {
      console.log('[BotControl] Cannot stop: not running');
      return;
    }
    
    try {
      onStop();
      console.log('[BotControl] Bot stopped successfully');
    } catch (error) {
      // console.error('[BotControl] Failed to stop bot:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary' : 'bg-destructive'}`} />
          <span className="text-sm text-muted-foreground">
            Status: {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Wallet: {walletConnected ? status.address.slice(0, 6) + '...' + status.address.slice(-4) : 'Not Connected'}
          </span>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleStartClick}
            disabled={!walletConnected || isRunning}
            className={`px-4 py-2 rounded-lg font-medium ${
              !walletConnected || isRunning
                ? 'bg-primary/50 text-primary-foreground/50 cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            Start Bot
          </button>
          <button
            onClick={handleStopClick}
            disabled={!isRunning}
            className={`px-4 py-2 rounded-lg font-medium ${
              !isRunning
                ? 'bg-destructive/50 text-destructive-foreground/50 cursor-not-allowed'
                : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
            }`}
          >
            Stop Bot
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Auto-Execution</span>
            <span className={`text-xs ${isExecutionEnabled ? 'text-primary' : 'text-muted-foreground'}`}>
              {isExecutionEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <button
            onClick={onToggleExecution}
            disabled={!walletConnected}
            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
              isExecutionEnabled ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                isExecutionEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Bot Statistics */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">Balance</div>
          <div className="text-xl font-semibold">{status.balance} SOL</div>
        </div>
        <div className="p-4 bg-card rounded-lg border border-border">
          <div className="text-sm text-muted-foreground">24h Profit</div>
          <div className="text-xl font-semibold text-primary">+0.00 SOL</div>
        </div>
      </div>
    </div>
  );
};

export default BotControl;
