# API Documentation

## RESTful Endpoints

### Price Data

#### GET /api/prices
Get current prices across all monitored DEXs.

```typescript
interface PriceResponse {
  dex: string;
  tokenPair: string;
  price: number;
  timestamp: string;
  liquidity: number;
}
```

#### GET /api/prices/history
Get historical price data with optional filtering.

Query Parameters:
- `dex`: DEX name
- `tokenPair`: Token pair symbol
- `startTime`: ISO timestamp
- `endTime`: ISO timestamp
- `interval`: Time interval (1m, 5m, 15m, 1h)

### Trade Execution

#### POST /api/trades/execute
Execute an arbitrage trade.

```typescript
interface TradeRequest {
  buyDex: string;
  sellDex: string;
  tokenPair: string;
  amount: number;
  minProfit: number;
  maxSlippage: number;
}

interface TradeResponse {
  success: boolean;
  txSignature?: string;
  error?: string;
  profit?: number;
}
```

#### GET /api/trades/history
Get historical trade data.

Query Parameters:
- `status`: Trade status (completed, failed)
- `startTime`: ISO timestamp
- `endTime`: ISO timestamp
- `limit`: Number of records

### Bot Control

#### POST /api/bot/start
Start the arbitrage bot.

```typescript
interface BotConfig {
  pairs: string[];
  minProfit: number;
  maxTradeSize: number;
  cooldownPeriod: number;
}
```

#### POST /api/bot/stop
Stop the arbitrage bot.

#### GET /api/bot/status
Get current bot status and configuration.

### Metrics

#### GET /api/metrics
Get performance metrics.

```typescript
interface Metrics {
  totalProfit: number;
  successRate: number;
  avgExecutionTime: number;
  activePairs: number;
  lastUpdate: string;
}
```

## WebSocket API

### Price Updates
```typescript
// Subscribe to price updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'prices',
  pairs: ['SOL/USDC', 'RAY/USDC']
}));

// Price update message
interface PriceUpdate {
  type: 'price';
  dex: string;
  pair: string;
  price: number;
  timestamp: string;
}
```

### Trade Updates
```typescript
// Subscribe to trade updates
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'trades'
}));

// Trade update message
interface TradeUpdate {
  type: 'trade';
  id: string;
  status: 'pending' | 'completed' | 'failed';
  profit?: number;
  error?: string;
  timestamp: string;
}
```

## Authentication

### API Key Authentication
All API requests must include an API key in the Authorization header:

```
Authorization: Bearer <api_key>
```

### WebSocket Authentication
WebSocket connections require an initial authentication message:

```typescript
ws.send(JSON.stringify({
  type: 'auth',
  apiKey: '<api_key>'
}));
```

## Rate Limits

- REST API: 100 requests per minute per IP
- WebSocket: 10 subscriptions per connection
- Trade execution: 5 trades per minute

## Error Handling

### HTTP Status Codes
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 429: Too Many Requests
- 500: Internal Server Error

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## Data Models

### Trade
```typescript
interface Trade {
  id: string;
  timestamp: string;
  buyDex: string;
  sellDex: string;
  tokenPair: string;
  amount: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  status: 'pending' | 'completed' | 'failed';
  txSignature?: string;
  error?: string;
}
```

### Price
```typescript
interface Price {
  id: string;
  timestamp: string;
  dex: string;
  tokenPair: string;
  price: number;
  liquidity: number;
  volume24h: number;
}
```

### Metric
```typescript
interface Metric {
  timestamp: string;
  totalProfit: number;
  successRate: number;
  avgExecutionTime: number;
  activePairs: number;
  errorRate: number;
  gasUsed: number;
}
```
