import { ethers } from 'ethers';

// Standard ERC20 ABI for token interactions
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
];

// Common tokens with their addresses (example for Ethereum mainnet)
export const COMMON_TOKENS = {
  ETH: {
    address: 'ETH',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  },
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ethereum',
    decimals: 18,
    logoURI: 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png',
  },
};

export const getTokenContract = (tokenAddress, provider) => {
  if (!tokenAddress || tokenAddress === 'ETH') return null;
  return new ethers.Contract(tokenAddress, ERC20_ABI, provider);
};

export const getTokenBalance = async (tokenAddress, walletAddress, provider) => {
  try {
    if (tokenAddress === 'ETH') {
      const balance = await provider.getBalance(walletAddress);
      return ethers.utils.formatEther(balance);
    }

    const contract = getTokenContract(tokenAddress, provider);
    if (!contract) return '0';

    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    return ethers.utils.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return '0';
  }
};

export const checkAndApproveToken = async (
  tokenAddress,
  spenderAddress,
  amount,
  signer
) => {
  try {
    if (tokenAddress === 'ETH') return true;

    const contract = getTokenContract(tokenAddress, signer);
    if (!contract) return false;

    const currentAllowance = await contract.allowance(
      await signer.getAddress(),
      spenderAddress
    );

    if (currentAllowance.lt(amount)) {
      const tx = await contract.approve(spenderAddress, amount);
      await tx.wait();
    }

    return true;
  } catch (error) {
    console.error('Error in token approval:', error);
    return false;
  }
};

export const formatTokenAmount = (amount, decimals = 18) => {
  if (!amount) return '0';
  const formatted = ethers.utils.formatUnits(amount, decimals);
  // Remove trailing zeros after decimal point
  return formatted.replace(/\.?0+$/, '');
};

export const parseTokenAmount = (amount, decimals = 18) => {
  try {
    return ethers.utils.parseUnits(amount || '0', decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return ethers.utils.parseUnits('0', decimals);
  }
};

// Fetch token price from a DEX or price feed (example implementation)
export const getTokenPrice = async (tokenAddress, provider) => {
  // This is a placeholder. In a real implementation, you would:
  // 1. Use price feeds (e.g., Chainlink)
  // 2. Query DEX pairs (e.g., Uniswap, Sushiswap)
  // 3. Use price API services
  return '1.00'; // Mock price
};

// Validate token address format
export const isValidTokenAddress = (address) => {
  try {
    return address === 'ETH' || ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};
