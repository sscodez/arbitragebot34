import React, { useRef, useEffect, useState } from 'react';
import { Log } from '../../types/app';

interface ConsoleProps {
  logs: Log[];
  isRunning: boolean;
}

const Console: React.FC<ConsoleProps> = ({ logs = [], isRunning }) => {
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const [displayedLogs, setDisplayedLogs] = useState<Log[]>([]);

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

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // Update displayed logs based on bot status
  useEffect(() => {
    if (isRunning) {
      setDisplayedLogs(logs);
    } else {
      // Clear logs when bot stops
      setDisplayedLogs([]);
    }
  }, [logs, isRunning]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedLogs]);

  return (
    <div className="font-mono text-sm space-y-2">
      {isRunning ? (
        displayedLogs.map((log, index) => (
          <div key={index} className="flex items-start space-x-2">
            <span className="text-muted-foreground">[{formatTimestamp(log.timestamp)}]</span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))
      ) : (
        <div className="text-muted-foreground italic">Bot is stopped. No logs to display.</div>
      )}
      <div ref={consoleEndRef} />
    </div>
  );
};

export default Console;
