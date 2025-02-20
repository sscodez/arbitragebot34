class WebSocketService {
  constructor() {
    this.subscribers = new Set();
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.isConnected = false;
  }

  connect() {
    const wsUrl = 'ws://localhost:3001';
    console.log('Connecting to WebSocket server at:', wsUrl);
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket Connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifySubscribers({
        type: 'connection',
        data: { status: 'connected' }
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);

        // Handle different message types
        switch (message.type) {
          case 'priceUpdate':
            console.log('Price Update:', {
              pair: Object.keys(message.data)[0],
              dexA: message.data[Object.keys(message.data)[0]].dexA,
              dexB: message.data[Object.keys(message.data)[0]].dexB
            });
            break;

          case 'botStatus':
            console.log('Bot Status:', {
              status: message.data.status,
              address: message.data.address,
              uptime: message.data.uptime,
              stats: message.data.stats,
              config: message.data.config
            });
            break;

          case 'arbitrageOpportunity':
            console.log('Arbitrage Opportunity:', {
              pair: message.data.pair,
              profit: message.data.profit + '%',
              buyDex: message.data.buyDex,
              sellDex: message.data.sellDex,
              buyPrice: message.data.buyPrice,
              sellPrice: message.data.sellPrice,
              amount: message.data.amount,
              expectedProfitUSD: '$' + message.data.expectedProfitUSD
            });
            break;

          case 'transactionUpdate':
            console.log('Transaction Update:', {
              status: message.data.status,
              hash: message.data.hash,
              profit: message.data.profit,
              amount: message.data.amount
            });
            break;

          case 'arbitrageOpportunity':
            this.notifySubscribers({
              type: 'arbitrageOpportunity',
              data: {
                pair: message.data.pair,
                profit: message.data.profit,
                timestamp: message.data.timestamp
              }
            });
            break;

          case 'transactionUpdate':
            this.notifySubscribers({
              type: 'transactionUpdate',
              data: {
                hash: message.data.hash,
                status: message.data.status
              }
            });
            break;

          case 'error':
            console.error('Bot Error:', message.data.message);
            break;

          default:
            console.log('Unknown message type:', message);
        }

        this.notifySubscribers(message);
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        this.notifySubscribers({
          type: 'error',
          data: { message: 'Error processing WebSocket message' }
        });
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.notifySubscribers({
        type: 'error',
        data: { message: 'WebSocket connection error' }
      });
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      this.isConnected = false;
      this.notifySubscribers({
        type: 'connection',
        data: { status: 'disconnected' }
      });
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    } else {
      console.error('Max reconnection attempts reached');
      this.notifySubscribers({
        type: 'error',
        data: {
          message: 'Failed to connect to WebSocket server after multiple attempts'
        }
      });
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  notifySubscribers(message) {
    this.subscribers.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  updateBotConfig(address, config) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'botConfig',
        address,
        config
      };
      console.log('Sending bot config:', message);
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected');
      this.notifySubscribers({
        type: 'error',
        data: { message: 'WebSocket not connected' }
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

const wsService = new WebSocketService();
export default wsService;
