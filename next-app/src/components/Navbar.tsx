import React, { useState } from 'react';
import WalletConnect from './WalletConnect';
import Link from 'next/link';

interface NavbarProps {
  onConnect: (data: { address: string }) => void;
  walletAddress: string;
  botStatus: 'running' | 'stopped';
  rpcUrl: string;
}

const Navbar: React.FC<NavbarProps> = ({ onConnect, walletAddress, botStatus, rpcUrl }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const networkStatus = "Solana Mainnet"; // Updated to Solana

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
              <Link href="/" className="text-xl font-bold text-primary">
                Solana Dex Arbitrage
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/arbitrage" 
                className="px-3 py-1 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80"
              >
                Arbitrage Scanner
              </Link>
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

          {/* Right section - Wallet Connect */}
          <div className="flex items-center space-x-4">
            <WalletConnect 
              onConnect={onConnect} 
              walletAddress={walletAddress} 
              rpcUrl={rpcUrl}
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
