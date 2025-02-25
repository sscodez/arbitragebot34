import React, { useState, useEffect, useRef } from 'react';
import { LogViewerProps, Log } from '@/types/app';
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

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
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

  const filteredLogs = filterLogs(logs, {
    type: filter === 'all' ? undefined : filter,
    search: searchTerm,
    ...getTimeRangeFilter()
  });

  const logStats = groupLogsByType(logs);

  return (
    <div className="space-y-4">
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
            onClick={() => downloadLogs(logs)}
            className="px-3 py-1.5 bg-secondary/50 text-sm rounded-lg border border-border hover:bg-secondary/70"
          >
            Download Logs
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-sm text-gray-400">Total Logs</div>
        </div>
        <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
          <div className="text-2xl font-bold text-red-400">{logStats.error?.length || 0}</div>
          <div className="text-sm text-gray-400">Errors</div>
        </div>
        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
          <div className="text-2xl font-bold text-yellow-400">{logStats.warning?.length || 0}</div>
          <div className="text-sm text-gray-400">Warnings</div>
        </div>
        <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
          <div className="text-2xl font-bold text-green-400">{logStats.success?.length || 0}</div>
          <div className="text-sm text-gray-400">Success</div>
        </div>
        <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
          <div className="text-2xl font-bold text-blue-400">{logStats.info?.length || 0}</div>
          <div className="text-sm text-gray-400">Info</div>
        </div>
      </div>

      {/* Logs */}
      <div 
        ref={scrollRef}
        className="space-y-2 max-h-[32rem] overflow-y-auto rounded-lg border border-border p-4 bg-card"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No logs match your filters
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <div
              key={index}
              className={`border rounded-lg ${getLogBackground(log.type)}`}
            >
              <div className="py-2 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${getLogSeverityColor(log.type)}`}>
                      {formatLogMessage(log)}
                    </span>
                    {log.level && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        log.level === 'high' ? 'bg-red-500/10 text-red-400' :
                        log.level === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {log.level}
                      </span>
                    )}
                    {log.txHash && (
                      <button
                        onClick={() => copyToClipboard(log.txHash!)}
                        className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full hover:bg-secondary/70"
                        title="Copy transaction hash"
                      >
                        Tx: {log.txHash.slice(0, 6)}...{log.txHash.slice(-4)}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getLogBackground(log.type)}`}>
                      {log.type}
                    </span>
                    <span className="text-xs text-gray-400 tabular-nums">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>
                </div>
                {log.data && (
                  <div className="mt-2 text-xs text-gray-400 bg-secondary/30 rounded p-2 overflow-x-auto">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.metadata && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(log.metadata).map(([key, value]) => (
                      <span
                        key={key}
                        className="text-xs bg-secondary/30 px-2 py-0.5 rounded-full text-gray-400"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;
