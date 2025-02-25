import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SUPPORTED_CHAINS } from '@/constant/chains';

interface PhantomWalletConnectProps {
  onConnect: (address: string) => void;
  onDisconnect: () => void;
  selectedChain: string;
  onChainChange: (chain: string) => void;
}

const PhantomWalletConnect: React.FC<PhantomWalletConnectProps> = ({
  onConnect,
  onDisconnect,
  selectedChain,
  onChainChange,
}) => {
  const { connected, publicKey, disconnect } = useWallet();
  const [evmAddress, setEvmAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChainChange = (chain: string) => {
    if (selectedChain === 'SOLANA' && connected) {
      disconnect();
    } else {
      setEvmAddress(null);
    }
    onDisconnect();
    onChainChange(chain);
  };

  const handleDisconnect = useCallback(async () => {
    try {
      if (selectedChain === 'SOLANA') {
        await disconnect();
      } else {
        setEvmAddress(null);
      }
      onDisconnect();
    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedChain, disconnect, onDisconnect]);

  const connectMetaMask = useCallback(async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install MetaMask to connect.');
      }

      // Get the current chain ID
      const currentChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      // Define chain parameters
      const chainParams = {
        BSC: {
          chainId: '0x38',
          chainName: 'BNB Smart Chain',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://bsc-dataseed1.binance.org', 'https://bsc-dataseed2.binance.org'],
          blockExplorerUrls: ['https://bscscan.com']
        },
        ETH: {
          chainId: '0x1',
          chainName: 'Ethereum Mainnet',
          nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://mainnet.infura.io/v3/'],
          blockExplorerUrls: ['https://etherscan.io']
        }
      };

      const targetChainId = selectedChain === 'BSC' ? '0x38' : '0x1';
      
      // Switch chain if necessary
      if (currentChainId !== targetChainId) {
        try {
          // First try to switch to the chain
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetChainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask
          if (switchError.code === 4902 || switchError.code === -32603) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [chainParams[selectedChain as keyof typeof chainParams]]
              });
            } catch (addError: any) {
              throw new Error(`Failed to add ${selectedChain} network to MetaMask: ${addError.message}`);
            }
          } else {
            throw new Error(`Failed to switch to ${selectedChain} network: ${switchError.message}`);
          }
        }
      }

      // Verify we're on the correct chain after switching
      const newChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });
      
      if (newChainId !== targetChainId) {
        throw new Error(`Please switch to ${selectedChain === 'BSC' ? 'BNB Smart Chain' : 'Ethereum'} network in MetaMask`);
      }

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please check MetaMask and try again.');
      }

      const address = accounts[0];
      setEvmAddress(address);
      onConnect(address);

      // Add event listeners for account and chain changes
      window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
        if (!newAccounts || newAccounts.length === 0) {
          handleDisconnect();
          setError('MetaMask account disconnected');
        } else {
          setEvmAddress(newAccounts[0]);
          onConnect(newAccounts[0]);
        }
      });

      window.ethereum.on('chainChanged', (newChainId: string) => {
        const expectedChainId = selectedChain === 'BSC' ? '0x38' : '0x1';
        if (newChainId !== expectedChainId) {
          handleDisconnect();
          setError(`Please switch to ${selectedChain === 'BSC' ? 'BNB Smart Chain' : 'Ethereum'} network`);
        }
      });

    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
      handleDisconnect();
    }
  }, [selectedChain, onConnect, handleDisconnect]);

  useEffect(() => {
    if (selectedChain === 'SOLANA') {
      if (connected && publicKey) {
        onConnect(publicKey.toString());
        setEvmAddress(null);
      } else {
        onDisconnect();
      }
    } else {
      // For EVM chains, disconnect Solana connection if active
      if (connected) {
        disconnect();
      }
    }
  }, [connected, publicKey, selectedChain, onConnect, onDisconnect, disconnect]);

  // Cleanup function for MetaMask event listeners
  useEffect(() => {
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="bg-card rounded-lg p-6 space-y-4">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-primary">Wallet Connection</h2>
          {(connected || evmAddress) && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              Disconnect
            </button>
          )}
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg relative">
            {error}
            <button
              className="absolute top-0 right-0 px-4 py-3 text-red-400 hover:text-red-300"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium text-gray-300">Select Chain</label>
          <select
            className="form-select block w-full rounded-lg bg-secondary/50 border-secondary-foreground/10 focus:border-primary focus:ring focus:ring-primary/20"
            value={selectedChain}
            onChange={(e) => handleChainChange(e.target.value)}
          >
            {Object.entries(SUPPORTED_CHAINS).map(([chainKey, chain]) => (
              <option key={chainKey} value={chainKey}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-4 mt-2">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium text-gray-300">Select Wallet</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedChain === 'ETH' ? (
                <>
                  <button
                    onClick={connectMetaMask}
                    className="flex items-center justify-center px-4 py-2.5 bg-secondary/50 hover:bg-secondary/70 text-white rounded-lg transition-colors space-x-2 border border-secondary-foreground/10"
                  >
                    <img src="/metamask-logo.svg" alt="MetaMask" className="w-5 h-5" />
                    <span>MetaMask</span>
                  </button>
                  <WalletMultiButton className="phantom-button !bg-secondary/50 hover:!bg-secondary/70 !border !border-secondary-foreground/10" />
                </>
              ) : selectedChain === 'BSC' ? (
                <button
                  onClick={connectMetaMask}
                  className="flex items-center justify-center px-4 py-2.5 bg-[#F3BA2F]/10 hover:bg-[#F3BA2F]/20 text-white rounded-lg transition-colors space-x-2 border border-[#F3BA2F]/20"
                >
                  <img src="/metamask-logo.svg" alt="MetaMask" className="w-5 h-5" />
                  <span>Connect MetaMask (BSC)</span>
                </button>
              ) : (
                <WalletMultiButton className="phantom-button !bg-secondary/50 hover:!bg-secondary/70 !border !border-secondary-foreground/10" />
              )}
            </div>
          </div>
        </div>

        {(connected || evmAddress) && (
          <div className="mt-4 p-4 bg-secondary/30 rounded-lg border border-secondary-foreground/10">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Connected Address</span>
                <span className="text-sm font-mono text-primary">
                  {selectedChain === 'SOLANA' 
                    ? publicKey?.toString().slice(0, 4) + '...' + publicKey?.toString().slice(-4)
                    : evmAddress?.slice(0, 4) + '...' + evmAddress?.slice(-4)
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Network</span>
                <span className="text-sm font-medium text-white">
                  {SUPPORTED_CHAINS[selectedChain].name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhantomWalletConnect;
