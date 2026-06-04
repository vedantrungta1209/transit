import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './jwt';
import { setDriverLocation } from './redis';
import { prisma } from './prisma';

export function setupSocketHandlers(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    socket.join(`${user.type}:${user.id}`);

    if (user.type === 'driver') {
      socket.on('location:update', async (data: { lat: number; lng: number; heading?: number }) => {
        await setDriverLocation(user.id, data.lat, data.lng, data.heading);
        // Broadcast to any active ride's user
        const activeRide = await prisma.ride.findFirst({
          where: { driverId: user.id, status: { in: ['DRIVER_ARRIVING', 'IN_PROGRESS'] } },
        });
        if (activeRide) {
          io.to(`user:${activeRide.userId}`).emit('driver_location', {
            driverId: user.id, lat: data.lat, lng: data.lng, heading: data.heading,
          });
        }
      });
    }

    socket.on('disconnect', () => {});
  });
}
