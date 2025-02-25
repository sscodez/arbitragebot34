import { Log } from '@/types/app';

export const formatLogMessage = (log: Log): string => {
  let message = log.message;
  
  if (log.metadata) {
    if (log.metadata.pair) {
      message += ` [${log.metadata.pair}]`;
    }
    if (log.metadata.amount) {
      message += ` Amount: ${log.metadata.amount}`;
    }
    if (log.metadata.gas) {
      message += ` Gas: ${log.metadata.gas}`;
    }
  }

  return message;
};

export const getLogLevel = (log: Log): string => {
  if (log.level) return log.level;
  
  // Infer level from type if not explicitly set
  switch (log.type) {
    case 'error':
      return 'high';
    case 'warning':
      return 'medium';
    default:
      return 'low';
  }
};

export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const filterLogs = (logs: Log[], options: {
  type?: string;
  level?: string;
  search?: string;
  startTime?: number;
  endTime?: number;
}): Log[] => {
  return logs.filter(log => {
    if (options.type && options.type !== 'all' && log.type !== options.type) return false;
    if (options.level && log.level !== options.level) return false;
    if (options.search && !log.message.toLowerCase().includes(options.search.toLowerCase())) return false;
    if (options.startTime && log.timestamp < options.startTime) return false;
    if (options.endTime && log.timestamp > options.endTime) return false;
    return true;
  });
};

export const groupLogsByType = (logs: Log[]): Record<string, Log[]> => {
  return logs.reduce((acc, log) => {
    const type = log.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(log);
    return acc;
  }, {} as Record<string, Log[]>);
};

export const getLogSeverityColor = (type: string): string => {
  switch (type) {
    case 'error':
      return 'text-red-400 dark:text-red-400';
    case 'warning':
      return 'text-yellow-400 dark:text-yellow-400';
    case 'success':
      return 'text-green-400 dark:text-green-400';
    case 'info':
      return 'text-blue-400 dark:text-blue-400';
    default:
      return 'text-gray-400 dark:text-gray-400';
  }
};

export const getLogBackground = (type: string): string => {
  switch (type) {
    case 'error':
      return 'bg-red-500/10 border-red-500/20';
    case 'warning':
      return 'bg-yellow-500/10 border-yellow-500/20';
    case 'success':
      return 'bg-green-500/10 border-green-500/20';
    case 'info':
      return 'bg-blue-500/10 border-blue-500/20';
    default:
      return 'bg-gray-500/10 border-gray-500/20';
  }
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text:', err);
  });
};

export const downloadLogs = (logs: Log[]): void => {
  const content = JSON.stringify(logs, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bot-logs-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
