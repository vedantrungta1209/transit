import { Server } from 'socket.io';

let _io: Server | null = null;

export function setIo(instance: Server) {
  _io = instance;
}

export function getIo(): Server {
  if (!_io) throw new Error('Socket.IO not initialised');
  return _io;
}
