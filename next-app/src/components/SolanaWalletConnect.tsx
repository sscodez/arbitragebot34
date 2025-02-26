import React, { FC, useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

interface SolanaWalletConnectProps {
  onConnect: (publicKey: string) => void;
  onDisconnect: () => void;
}

const CustomWalletButton: FC = () => {
  const { connected, publicKey, select, disconnect, wallet, wallets } = useWallet();

  const handleConnect = async () => {
    try {
      // If not connected and no wallet selected, select Phantom
      if (!connected && !wallet) {
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
        if (phantomWallet) {
          await select(phantomWallet.adapter.name);
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <button
      onClick={connected ? disconnect : handleConnect}
      className={`
        w-full px-4 py-2 rounded-lg font-medium transition-all
        flex items-center justify-center space-x-2
        ${connected 
          ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary'
          : 'bg-primary text-white hover:bg-primary/90'
        }
      `}
    >
      <span>
        {connected
          ? `Connected: ${publicKey?.toString().slice(0, 6)}...${publicKey?.toString().slice(-4)}`
          : 'Connect Phantom Wallet'
        }
      </span>
      {connected && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
};

const SolanaWalletConnectContent: FC<SolanaWalletConnectProps> = ({
  onConnect,
  onDisconnect,
}) => {
  const { publicKey, connected, wallet } = useWallet();

  React.useEffect(() => {
    if (connected && publicKey) {
      onConnect(publicKey.toString());
    } else {
      onDisconnect();
    }
  }, [connected, publicKey, onConnect, onDisconnect]);

  return (
    <div className="flex flex-col space-y-4">
      <CustomWalletButton />
      {connected && publicKey && (
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Phantom Wallet Connected</span>
          </div>
          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground">Wallet Address</p>
            <p className="font-mono text-sm text-foreground break-all">
              {publicKey.toString()}
            </p>
          </div>
        </div>
      )}
      {!connected && !wallet && (
        <p className="text-sm text-muted-foreground">
          Please make sure you have the Phantom wallet browser extension installed.
        </p>
      )}
    </div>
  );
};

export const SolanaWalletConnect: FC<SolanaWalletConnectProps> = (props) => {
  // Set to 'mainnet-beta' for production
  const network = WalletAdapterNetwork.Mainnet;
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
          <SolanaWalletConnectContent {...props} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletConnect;
