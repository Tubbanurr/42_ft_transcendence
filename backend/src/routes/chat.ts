import { FastifyInstance } from "fastify";
import { z } from "zod";
import { messagesDb, notificationsDb } from "../db.js";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

const IdParams = z.object({
  id: z.coerce.number().int().positive(),
});

const SendMessageBody = z.object({
  content: z.string().min(1).max(1000),
});

export default async function chatRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (req, reply) => {
    try {
      const payload = await (req as any).jwtVerify() as { userId: number };
      (req as any).user = payload;
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  fastify.get("/conversation/:id", async (request, reply) => {
    try {
      const { id: friendId } = IdParams.parse(request.params);
      const userId = (request as any).user.userId;
      
      console.log(`📖 Loading conversation between ${userId} and ${friendId}`);
      
      const messages = await messagesDb.getConversation(userId, friendId);
      
      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        where: [{ id: userId }, { id: friendId }],
        select: ['id', 'username', 'display_name', 'avatar_url']
      });
      
      const userMap = new Map(users.map(u => [u.id, u]));
      
      const processedMessages = messages.map((msg: any) => {
        const sender = userMap.get(msg.senderId);
        return {
          ...msg,
          senderId: Number(msg.senderId),
          receiverId: Number(msg.receiverId),
          sender: sender ? {
            id: sender.id,
            username: sender.username,
            displayName: sender.display_name,
            avatarUrl: sender.avatar_url
          } : null
        };
      });
      
      return { messages: processedMessages };
    } catch (error) {
      console.error("Error getting conversation:", error);
      return reply.code(500).send({ error: "Failed to load conversation" });
    }
  });

  fastify.post("/send/:id", async (request, reply) => {
    try {
      const { id: friendId } = IdParams.parse(request.params);
      const userId = (request as any).user.userId;
      const { content } = SendMessageBody.parse(request.body);

      console.log(`📤 Sending message from ${userId} to ${friendId}: ${content}`);

      const message = await messagesDb.send(userId, friendId, content);
      
      const userRepo = AppDataSource.getRepository(User);
      const sender = await userRepo.findOneBy({ id: userId });
      
      if (sender) {
        await notificationsDb.create(friendId, "message", `${sender.display_name || sender.username} tarafından yeni mesaj`);
      }
      
      const messageWithSender = {
        ...message,
        senderId: Number(message.senderId),
        receiverId: Number(message.receiverId),
        sender: sender ? {
          id: sender.id,
          username: sender.username,
          displayName: sender.display_name,
          avatarUrl: sender.avatar_url
        } : null
      };

      const io = (fastify as any).io;
      if (io) {
        io.to(`user_${friendId}`).emit("privateMessage", messageWithSender);
      }

      return { message: messageWithSender };
    } catch (error) {
      console.error("Error sending message:", error);
      return reply.code(500).send({ error: "Failed to send message" });
    }
  });

  fastify.get("/unread-count", async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const count = await messagesDb.countUnread(userId);
      return { unread: count };
    } catch (error) {
      console.error("Error getting unread count:", error);
      return reply.code(500).send({ error: "Failed to get unread count" });
    }
  });

  fastify.post("/mark-read/:id", async (request, reply) => {
    try {
      const userId = (request as any).user.userId;
      const { id: friendId } = IdParams.parse(request.params);
      
      await messagesDb.markAsRead(userId, friendId);
      
      return { success: true };
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return reply.code(500).send({ error: "Failed to mark messages as read" });
    }
  });
}
