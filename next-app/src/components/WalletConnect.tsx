import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

interface WalletConnectProps {
  onConnect: (data: { address: string }) => void;
  rpcUrl: string;
  walletAddress?: string;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ onConnect, rpcUrl, walletAddress }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string>('');
  const [balance, setBalance] = useState<string>('');

  useEffect(() => {
    const fetchWalletInfo = async () => {
      if (walletAddress && window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const network = await provider.getNetwork();
          setNetworkName(network.name);
          
          const balanceWei = await provider.getBalance(walletAddress);
          const balanceEth = ethers.utils.formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } catch (err) {
          console.error('Error fetching wallet info:', err);
        }
      }
    };

    fetchWalletInfo();
  }, [walletAddress]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('Please install MetaMask to connect your wallet');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      
      onConnect({ address });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  if (walletAddress) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-3 px-4 py-2 bg-secondary rounded-lg border border-border">
          {/* Network Indicator */}
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-sm text-muted-foreground hidden md:inline">
              {networkName.charAt(0).toUpperCase() + networkName.slice(1)}
            </span>
          </div>

          {/* Balance */}
          <div className="hidden md:block border-l border-border pl-3">
            <span className="text-sm text-muted-foreground">{balance} ETH</span>
          </div>

          {/* Address */}
          <div className="border-l border-border pl-3">
            <span className="text-sm font-medium">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={() => window.location.reload()}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
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
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          isConnecting
            ? 'bg-primary/50 cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90'
        } text-primary-foreground`}
      >
        {isConnecting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>Connect Wallet</span>
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full mt-2 w-72 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
