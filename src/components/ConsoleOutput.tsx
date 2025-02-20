import React, { useRef, useEffect } from 'react';
import { ArrowDownIcon } from '@heroicons/react/24/outline';

function ConsoleOutput({ logs }) {
  const consoleRef = useRef(null);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-primary-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-blue-400';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-dark-card rounded-lg border border-dark-border">
      <div className="flex items-center justify-between p-4 border-b border-dark-border">
        <h2 className="text-xl font-semibold text-primary-400">Console Output</h2>
        <button 
          className="text-dark-text/60 hover:text-primary-400 transition-colors"
          onClick={() => {
            if (consoleRef.current) {
              consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
            }
          }}
        >
          <ArrowDownIcon className="h-5 w-5" />
        </button>
      </div>
      
      <div 
        ref={consoleRef}
        className="h-96 overflow-y-auto font-mono text-sm p-4 bg-dark-bg/50 space-y-2"
      >
        {logs.map((log, index) => (
          <div 
            key={index}
            className={`flex items-start space-x-2 ${getLogColor(log.type)}`}
          >
            <span className="text-dark-text/40 min-w-[80px]">
              {formatTimestamp(log.timestamp)}
            </span>
            <span className="break-all">{log.message}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="text-dark-text/40 text-center py-4">
            No logs available
          </div>
        )}
      </div>
    </div>
  );
}

export default ConsoleOutput;
