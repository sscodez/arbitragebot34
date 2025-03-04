import React, { useState, useEffect, useRef } from 'react';
import { LogViewerProps, Log, BotStatus } from '@/types/app';
import {
  formatLogMessage,
  getLogLevel,
  formatTimestamp,
  filterLogs,
  groupLogsByType,
  getLogSeverityColor,
  getLogBackground,
  copyToClipboard,
  downloadLogs
} from '@/utils/logUtils';

interface LogViewerProps {
  logs: Log[];
  botStatus: BotStatus;
  walletConnected: boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, botStatus, walletConnected }) => {
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [timeRange, setTimeRange] = useState<'all' | '1h' | '24h' | '7d'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLogTypeStyle = (type: string) => {
    switch (type) {
      case 'info':
        return 'text-primary';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatLogContent = (log: Log): string => {
    let content = log.message;
    if (log.metadata) {
      try {
        content += ' ' + JSON.stringify(log.metadata, null, 2);
      } catch (err) {
        console.error('Failed to stringify log metadata:', err);
      }
    }
    return content;
  };

  const getTimeRangeFilter = () => {
    const now = Date.now();
    switch (timeRange) {
      case '1h':
        return { startTime: now - 3600000 };
      case '24h':
        return { startTime: now - 86400000 };
      case '7d':
        return { startTime: now - 604800000 };
      default:
        return {};
    }
  };

  const filteredLogs = logs.filter(log => {
    // Time range filter
    const { startTime } = getTimeRangeFilter();
    if (startTime && log.timestamp < startTime) {
      return false;
    }

    // Type filter
    if (filter !== 'all' && log.type !== filter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const content = formatLogContent(log).toLowerCase();
      if (!content.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center space-x-4 mb-4 p-3 bg-secondary rounded-lg">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${walletConnected ? 'bg-primary' : 'bg-destructive'}`}></span>
          <span className="text-sm text-muted-foreground">
            Wallet: {walletConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${botStatus.isRunning ? 'bg-primary' : 'bg-muted'}`}></span>
          <span className="text-sm text-muted-foreground">
            Bot: {botStatus.isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        {botStatus.isRunning && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Balance: {botStatus.balance} SOL
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border border-border">
        <div className="flex space-x-2 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-primary"
          >
            <option value="all">All Logs</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="success">Success</option>
            <option value="info">Info</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-primary"
          >
            <option value="all">All Time</option>
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm focus:ring-primary"
          />
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="form-checkbox rounded text-primary focus:ring-primary"
            />
            <span>Auto-scroll</span>
          </label>
          <button
            onClick={() => {
              const content = logs.map(log => 
                `[${new Date(log.timestamp).toISOString()}] ${log.type.toUpperCase()}: ${formatLogContent(log)}`
              ).join('\n');
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `bot-logs-${new Date().toISOString()}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 bg-secondary/50 text-sm rounded-lg border border-border hover:bg-secondary/70"
          >
            Download Logs
          </button>
        </div>
      </div>

      {/* Log Container */}
      <div 
        ref={scrollRef}
        className="h-[400px] overflow-y-auto rounded-lg border border-border bg-card p-4"
      >
        <div className="space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="text-muted-foreground">No logs available</span>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-2 p-2 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`text-sm ${getLogTypeStyle(log.type)}`}>
                  {log.message}
                </span>
                {log.metadata && (
                  <pre className="text-xs text-muted-foreground mt-1 bg-secondary/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewer;
