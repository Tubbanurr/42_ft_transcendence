import type { Server as IOServer, Socket as IOSocket } from "socket.io";
import { Server } from "socket.io";
import type { FastifyInstance } from "fastify";
import { registerFriendSocket } from "./friends.socket";
import { registerTwoSocket } from "./two.socket";
import { registerChatSocket } from "./chat.socket";
import { registerTournamentSocket } from "./tournament.socket";
import { registerTournamentTwoSocket } from "./turnuva.two.socket";
import { AuthService } from "../services/auth.service";

export let io: IOServer;

export function registerSockets(fastify: FastifyInstance): void {
  io = new Server(fastify.server, {
    path: "/ws",
    cors: { origin: true, credentials: true },
  });

  io.use((socket: IOSocket, next) => {
    try {
      const authHeader = socket.handshake.headers.authorization as string | undefined;
      const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
      const token = (socket.handshake.auth as any)?.token || bearer;
      if (!token) return next(new Error("No token"));

      const payload: any = (fastify as any).jwt.verify(token);
      (socket.data as any).userId = String(payload.userId);
      (socket.data as any).username = payload.username;

      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: IOSocket) => {
    const username = (socket.data as any).username;
    const userId = (socket.data as any).userId;

    if (userId) {
      console.log(`✅ Socket connected: ${username ?? "user"} (${socket.id})`);
      socket.join(String(userId));
      
      try {
        await AuthService.updateUserOnlineStatus(parseInt(userId), true);
        console.log(`🟢 User ${username} is now online`);
        
        await notifyFriendsStatusChange(parseInt(userId), true);
      } catch (error) {
        console.error(`❌ Failed to update online status for user ${userId}:`, error);
      }
    } else {
      console.log(`✅ Socket connected (guest): ${socket.id}`);
    }

    socket.on("disconnect", async (reason) => {
      if (username && userId) {
        console.log(`❌ Socket disconnected: ${username} (${reason})`);
        
        const userSockets = await io.in(String(userId)).fetchSockets();
        const remainingConnections = userSockets.filter(s => s.id !== socket.id);
        
        if (remainingConnections.length === 0) {
          try {
            await AuthService.updateUserOnlineStatus(parseInt(userId), false);
            console.log(`🔴 User ${username} is now offline`);
            
            await notifyFriendsStatusChange(parseInt(userId), false);
          } catch (error) {
            console.error(`❌ Failed to update offline status for user ${userId}:`, error);
          }
        } else {
          console.log(`🟡 User ${username} still has ${remainingConnections.length} active connections`);
        }
      } else {
        console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);
      }
    });
  });

  async function notifyFriendsStatusChange(userId: number, isOnline: boolean) {
    try {
      const { friendsDb } = await import("../db");
      const friends = await friendsDb.getFriends(userId);
      
      for (const friend of friends) {
        io.to(String(friend.id)).emit('friend:status:changed', {
          userId: userId,
          isOnline: isOnline,
          lastSeen: isOnline ? null : new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('❌ Failed to notify friends about status change:', error);
    }
  }
  registerFriendSocket(io);
  registerTwoSocket(io);
  registerChatSocket(io);
  registerTournamentSocket(io);
  registerTournamentTwoSocket(io);
  (fastify as any).decorate("io", io);
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.IO is not initialized yet");
  return io;
}
