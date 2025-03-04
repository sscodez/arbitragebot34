import Big from 'big.js';

// Minimum liquidity required in a pool to consider it for arbitrage (in USD)
export const MINIMUM_LIQUIDITY_THRESHOLD = new Big('1000'); // $1000 minimum liquidity

// Minimum profit required to execute an arbitrage trade (in USD)
export const MINIMUM_PROFIT_THRESHOLD = new Big('0.1'); // 0.1% minimum profit

// Maximum allowed price impact for a trade (as a decimal)
export const MAX_PRICE_IMPACT = new Big('0.01'); // 1%

// Default amount to use for price calculations
export const DEFAULT_QUOTE_AMOUNT = new Big('100');

// Maximum slippage tolerance for trades (in decimal)
export const MAX_SLIPPAGE = 0.005; // 0.5%

// Bot configuration
export const BOT_CHECK_INTERVAL = 3000; // 3 seconds

// API configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 2000; // 2 seconds
export const BATCH_DELAY = 3000; // 3 seconds between batches

// Cache configuration
export const CACHE_TTL = 60000; // 1 minute cache

// API endpoints
export const RAYDIUM_API_ENDPOINT = 'https://api-v3.raydium.io';
