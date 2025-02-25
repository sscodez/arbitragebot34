import { useState, useCallback } from 'react';
import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { providers } from 'ethers';
import { ChainType } from '@/services/ArbitrageService';
import { SolanaEndpoints } from '@/constant/solana';

export const useWallet = () => {
  const [provider, setProvider] = useState<Connection | providers.Web3Provider | null>(null);
  const [wallet, setWallet] = useState<Keypair | string | null>(null);
  const [selectedChain, setSelectedChain] = useState<ChainType>('solana');
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = useCallback(async (chain: ChainType) => {
    try {
      setSelectedChain(chain);

      switch (chain) {
        case 'solana': {
          // For Solana, we'll use a new keypair for testing
          // In production, this should integrate with a real wallet like Phantom
          const connection = new Connection(SolanaEndpoints.mainnet.http, {
            wsEndpoint: SolanaEndpoints.mainnet.ws,
            commitment: 'confirmed'
          });
          const wallet = Keypair.generate();
          
          setProvider(connection);
          setWallet(wallet);
          setIsConnected(true);
          break;
        }
        
        case 'bsc':
        case 'eth': {
          if (typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            const provider = new providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            
            setProvider(provider);
            setWallet(address);
            setIsConnected(true);
          } else {
            throw new Error('Please install MetaMask');
          }
          break;
        }
        
        default:
          throw new Error('Unsupported chain');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      disconnectWallet();
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setWallet(null);
    setIsConnected(false);
  }, []);

  const switchChain = useCallback(async (chain: ChainType) => {
    disconnectWallet();
    await connectWallet(chain);
  }, [connectWallet, disconnectWallet]);

  return {
    provider,
    wallet,
    selectedChain,
    isConnected,
    connectWallet,
    disconnectWallet,
    switchChain
  };
};
