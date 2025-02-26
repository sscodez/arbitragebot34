import React from 'react';
import { SUPPORTED_CHAINS } from '../../constant/chains';

interface ChainSelectorProps {
  selectedChain: string;
  onChainSelect: (chainId: string) => void;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({ selectedChain, onChainSelect }) => {
  const chains = Object.entries(SUPPORTED_CHAINS);

  return (
    <div className="bg-card rounded-lg shadow-glow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-primary">Network Selection</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            {SUPPORTED_CHAINS[selectedChain].name}
          </span>
          <div className={`w-2 h-2 rounded-full bg-primary animate-pulse`} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {chains.map(([chainId, chain]) => (
          <button
            key={chainId}
            onClick={() => onChainSelect(chainId)}
            className={`
              relative flex flex-col items-center p-4 rounded-lg border transition-all
              ${selectedChain === chainId
                ? 'border-primary bg-primary/10 text-primary shadow-glow-sm'
                : 'border-border hover:border-primary/50 hover:bg-secondary'
              }
            `}
          >
            <div className="absolute top-2 right-2">
              <div className={`w-2 h-2 rounded-full ${
                selectedChain === chainId ? 'bg-primary' : 'bg-muted'
              }`} />
            </div>
            
            <div className="text-center">
              <p className="font-medium text-lg">{chain.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Object.keys(chain.dexes).length} DEXes
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="col-span-3 sm:col-span-1">
          <div className="bg-background/50 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">DEXes</p>
            <p className="text-lg font-semibold text-primary">
              {Object.keys(SUPPORTED_CHAINS[selectedChain].dexes).length}
            </p>
          </div>
        </div>
        <div className="col-span-3 sm:col-span-1">
          <div className="bg-background/50 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">Tokens</p>
            <p className="text-lg font-semibold text-primary">
              {Object.keys(SUPPORTED_CHAINS[selectedChain].tokens).length}
            </p>
          </div>
        </div>
        <div className="col-span-3 sm:col-span-1">
          <div className="bg-background/50 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">Chain ID</p>
            <p className="text-lg font-semibold text-primary">
              {SUPPORTED_CHAINS[selectedChain].id}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChainSelector;
