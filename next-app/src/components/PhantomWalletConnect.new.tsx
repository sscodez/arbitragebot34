'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

// Dynamically import WalletMultiButton with no SSR
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { 
    ssr: false,
    loading: () => (
      <button className="btn-primary px-4 py-2 rounded-md">
        Loading...
      </button>
    )
  }
);

interface PhantomWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  walletAddress: string;
}

const PhantomWalletConnect: React.FC<PhantomWalletConnectProps> = ({
  onConnect,
  onDisconnect,
  walletAddress
}) => {
  const { connected, publicKey } = useWallet();

  React.useEffect(() => {
    if (connected && publicKey) {
      onConnect(publicKey.toString());
    } else if (!connected && walletAddress) {
      onDisconnect();
    }
  }, [connected, publicKey, walletAddress, onConnect, onDisconnect]);

  return (
    <div className="flex items-center space-x-2">
      {connected && publicKey && (
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          <span className="text-sm text-muted-foreground">
            {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
          </span>
        </div>
      )}
      <WalletMultiButton className="btn-primary" />
    </div>
  );
};

// Export as a dynamic component with no SSR
export default dynamic(() => Promise.resolve(PhantomWalletConnect), {
  ssr: false,
});
