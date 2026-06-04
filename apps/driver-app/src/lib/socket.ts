import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket?.connected) return socket;
  socket = io(API_URL, { auth: { token }, reconnection: true, reconnectionDelay: 1000 });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
