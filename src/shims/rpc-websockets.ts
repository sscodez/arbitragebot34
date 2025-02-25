// Browser shim for rpc-websockets
class WebSocketClient {
  constructor() {
    throw new Error('WebSocket client is not supported in the browser');
  }
}

export default WebSocketClient;
