import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './app';
import { redis, pubClient, subClient } from './utils/redis';
import { setupSocketHandlers } from './utils/socket';
import { startSubscriptionCron } from './services/subscription-engine.service';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

export const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true },
  pingTimeout: 30000,
  pingInterval: 10000,
});

async function start() {
  await pubClient.connect();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));
  setupSocketHandlers(io);
  startSubscriptionCron();
  server.listen(PORT, () => console.log(`Transit API running on port ${PORT}`));
}

start().catch(console.error);
