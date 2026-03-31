// ... existing code ...
const socket = io({
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  timeout: 10000
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Handle connection error appropriately
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle general socket errors
});
// ... existing code ...