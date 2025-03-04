'use client';

import React from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  walletAddress: string;
}

const WalletConnect = ({ onConnect, onDisconnect, walletAddress }: WalletConnectProps) => {
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

interface ClientWalletProps {
  children: React.ReactNode;
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  walletAddress: string;
}

const ClientWallet = ({ children, onConnect, onDisconnect, walletAddress }: ClientWalletProps) => {
  // Set to 'mainnet-beta' for production
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="flex flex-col">
            <div className="flex justify-end p-4">
              <WalletConnect
                onConnect={onConnect}
                onDisconnect={onDisconnect}
                walletAddress={walletAddress}
              />
            </div>
            {children}
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default ClientWallet;
