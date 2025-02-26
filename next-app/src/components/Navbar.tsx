import React, { useState } from 'react';
import WalletConnect from './WalletConnect';

interface NavbarProps {
  onConnect: (data: { address: string }) => void;
  walletAddress: string;
  botStatus: 'running' | 'stopped';
  rpcUrl: string;
}

const Navbar: React.FC<NavbarProps> = ({ onConnect, walletAddress, botStatus, rpcUrl }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const networkStatus = "Ethereum Mainnet"; // This could be dynamic based on the connected network

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <svg 
                  className="w-5 h-5 text-primary" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="text-xl font-bold text-primary">Sass Dex Arbitrage</span>
            </div>
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-muted-foreground">{networkStatus}</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary">
                <span className={`w-2 h-2 rounded-full ${
                  botStatus === 'running' ? 'bg-primary' : 'bg-destructive'
                }`}></span>
                <span className="text-muted-foreground">Bot: {botStatus}</span>
              </div>
            </div>
          </div>

          {/* Right section - Wallet and Settings */}
          <div className="flex items-center space-x-4">
            <WalletConnect 
              onConnect={onConnect} 
              rpcUrl={rpcUrl} 
              walletAddress={walletAddress}
            />

            {/* Settings Button */}
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <svg 
                className="w-5 h-5 text-muted-foreground" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>

            {/* Settings Dropdown */}
            {isSettingsOpen && (
              <div className="absolute right-4 top-16 mt-2 w-56 rounded-lg bg-card border border-border shadow-lg">
                <div className="p-2">
                  <div className="px-3 py-2 text-sm font-medium text-primary">Settings</div>
                  <div className="divide-y divide-border">
                    <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md">
                      Network Settings
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md">
                      Gas Settings
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-md">
                      Notifications
                    </button>
                    <button className="w-full px-3 py-2 text-sm text-destructive hover:bg-secondary rounded-md">
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
