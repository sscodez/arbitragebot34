import { ethers } from 'ethers';

const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org');

const PAIR_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

const TOKEN_ABI = [
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function balanceOf(address) external view returns (uint256)',
  'function allowance(address,address) external view returns (uint256)',
  'function approve(address,uint256) external returns (bool)',
];

async function checkAndApproveToken(tokenAddress, spenderAddress, wallet, amount) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    const allowance = await tokenContract.allowance(wallet.address, spenderAddress);

    if (allowance.lt(amount)) {
      const tx = await tokenContract.approve(spenderAddress, amount);
      await tx.wait();
      return true;
    }
    return true;
  } catch (error) {
    console.error('Error in checkAndApproveToken:', error);
    return false;
  }
}

async function getTokenBalance(tokenAddress, wallet) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, wallet);
    const balance = await tokenContract.balanceOf(wallet.address);
    return balance;
  } catch (error) {
    console.error('Error in getTokenBalance:', error);
    return ethers.BigNumber.from(0);
  }
}

async function getTokenPrice(tokenAddress, dex) {
  try {
    const token = new ethers.Contract(tokenAddress, TOKEN_ABI, provider);
    const decimals = await token.decimals();
    const symbol = await token.symbol();

    return {
      address: tokenAddress,
      symbol,
      decimals,
    };
  } catch (error) {
    console.error('Error getting token price:', error);
    return null;
  }
}

async function getPairData(dex) {
  try {
    const factory = new ethers.Contract(
      dex.factory,
      ['function allPairs(uint) external view returns (address)', 'function allPairsLength() external view returns (uint)'],
      provider
    );

    const pairCount = await factory.allPairsLength();
    const pairs = [];

    // Get the first 100 pairs (or less if there are fewer pairs)
    const limit = Math.min(100, parseInt(pairCount.toString()));

    for (let i = 0; i < limit; i++) {
      const pairAddress = await factory.allPairs(i);
      const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);

      const [token0Address, token1Address, reserves] = await Promise.all([
        pair.token0(),
        pair.token1(),
        pair.getReserves(),
      ]);

      const [token0Data, token1Data] = await Promise.all([
        getTokenPrice(token0Address, dex),
        getTokenPrice(token1Address, dex),
      ]);

      if (token0Data && token1Data) {
        const price = calculatePrice(
          reserves[0],
          reserves[1],
          token0Data.decimals,
          token1Data.decimals
        );

        pairs.push({
          address: pairAddress,
          token0: token0Data,
          token1: token1Data,
          reserve0: reserves[0].toString(),
          reserve1: reserves[1].toString(),
          price: price.toString(),
        });
      }
    }

    return pairs;
  } catch (error) {
    console.error('Error getting pair data:', error);
    return [];
  }
}

function calculatePrice(reserve0, reserve1, decimals0, decimals1) {
  const amount0 = ethers.utils.formatUnits(reserve0, decimals0);
  const amount1 = ethers.utils.formatUnits(reserve1, decimals1);
  return parseFloat(amount1) / parseFloat(amount0);
}

export {
  checkAndApproveToken,
  getTokenBalance,
  getTokenPrice,
  getPairData,
};
