class WebSocketService {
    constructor() {
      this.ws = null;
      this.listeners = new Map();
      this.reconnectInterval = 3000;
      this.reconnectTimer = null;
    }
  
    connect(url = 'ws://localhost:5000/ws') {
      if (this.ws?.readyState === WebSocket.OPEN) return;
  
      this.ws = new WebSocket(url);
  
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };
  
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach(callback => callback(data));
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
  
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
  
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.reconnectTimer = setTimeout(() => this.connect(url), this.reconnectInterval);
      };
    }
  
    subscribe(callback) {
      const id = Math.random().toString(36).substr(2, 9);
      this.listeners.set(id, callback);
      return () => this.listeners.delete(id);
    }
  
    send(data) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      }
    }
  
    disconnect() {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      if (this.ws) this.ws.close();
    }
  }
  
  export default new WebSocketService();