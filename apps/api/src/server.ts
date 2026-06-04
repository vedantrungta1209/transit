import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import app from './app';
import { pubClient, subClient } from './utils/redis';
import { setupSocketHandlers } from './utils/socket';
import { startSubscriptionCron } from './services/subscription-engine.service';
import { setIo } from './utils/io';

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*', credentials: true },
  pingTimeout: 30000,
  pingInterval: 10000,
});

setIo(io);

async function start() {
  await pubClient.connect();
  await subClient.connect();
  io.adapter(createAdapter(pubClient, subClient));
  setupSocketHandlers(io);
  startSubscriptionCron();
  server.listen(PORT, () => console.log(`Transit API running on port ${PORT}`));
}

start().catch(console.error);
