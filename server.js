io.on('connection', (socket) => {
  console.log('Client connected',socket);

  socket.on('requestInitialData', () => {
    // Send initial parking data
    socket.emit('parkingUpdate', { sections: [...] });
  });

  socket.on('sectionSelect', (data) => {
    console.log('Section selected:', data);
    // Handle section selection
  });

  socket.on('floorSelect', (data) => {
    console.log('Floor selected:', data);
    // Handle floor selection
  });

  socket.on('zoneSelect', (data) => {
    console.log('Zone selected:', data);
    // Handle zone selection
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
}); 