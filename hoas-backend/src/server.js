import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { initSocket } from './sockets/socket.js';
import { startSchedulers, stopSchedulers } from './schedulers/index.js';

async function start() {
  await connectDatabase();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`HOAS backend listening on http://localhost:${env.port}`);
  });

  startSchedulers();

  const shutdown = async () => {
    console.log('Shutting down...');
    stopSchedulers();
    server.closeAllConnections?.();
    server.close();
    const { disconnectDatabase } = await import('./config/database.js');
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});