import React, { useRef, useEffect } from 'react';
import { Log } from '../../types/app';

interface ConsoleProps {
  logs: Log[];
}

const Console: React.FC<ConsoleProps> = ({ logs = [] }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const getLogColor = (type: Log['type']): string => {
    switch (type) {
      case 'error':
        return 'text-destructive';
      case 'success':
        return 'text-primary';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-foreground';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="font-mono text-sm space-y-2">
      {logs.map((log, index) => (
        <div key={index} className="flex items-start space-x-2">
          <span className="text-muted-foreground">[{formatTimestamp(log.timestamp)}]</span>
          <span className={getLogColor(log.type)}>{log.message}</span>
        </div>
      ))}
      {logs.length === 0 && (
        <div className="text-muted-foreground italic">No logs to display...</div>
      )}
      <div ref={consoleEndRef} />
    </div>
  );
};

export default Console;
