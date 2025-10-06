import { Server, Socket } from "socket.io";
import { messagesDb, notificationsDb } from "../db.js";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

export function registerChatSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as any).userId;
    const username = (socket.data as any).username;
    
    if (!userId) {
      console.log("❌ Chat socket: User not authenticated");
      return;
    }

    const userIdNum = Number(userId);
    console.log(`✅ Chat socket connected: ${username} (${userIdNum})`);
    
    socket.join(`user_${userIdNum}`);

    socket.on("privateMessage", async ({ receiverId, content }: { receiverId: number; content: string }) => {
      try {
        console.log(`📤 Private message from ${userIdNum} to ${receiverId}: ${content}`);
        
        if (!content?.trim()) {
          socket.emit("messageError", { error: "Message content cannot be empty" });
          return;
        }

        const message = await messagesDb.send(userIdNum, receiverId, content.trim());
        
        const userRepo = AppDataSource.getRepository(User);
        const sender = await userRepo.findOneBy({ id: userIdNum });
        
        if (sender) {
          await notificationsDb.create(receiverId, "message", `${sender.display_name || sender.username} tarafından yeni mesaj`);
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
        
        socket.emit("privateMessage", messageWithSender);
        
        io.to(`user_${receiverId}`).emit("privateMessage", messageWithSender);
        
        console.log(`✅ Message sent successfully from ${userIdNum} to ${receiverId}`);
        
      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    socket.on("joinConversation", async ({ friendId }: { friendId: number }) => {
      try {
        console.log(`👥 User ${userIdNum} joining conversation with ${friendId}`);
        
        const messages = await messagesDb.getConversation(userIdNum, friendId);
        
        const userRepo = AppDataSource.getRepository(User);
        const users = await userRepo.find({
          where: [{ id: userIdNum }, { id: friendId }],
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
        
        socket.emit("conversationHistory", { friendId, messages: processedMessages });
        
        await messagesDb.markAsRead(userIdNum, friendId);
        
        console.log(`✅ User ${userIdNum} joined conversation with ${friendId}`);
        
      } catch (error) {
        console.error("❌ Error joining conversation:", error);
        socket.emit("conversationError", { error: "Failed to load conversation" });
      }
    });

    socket.on("typing", ({ friendId, isTyping }: { friendId: number; isTyping: boolean }) => {
      socket.to(`user_${friendId}`).emit("userTyping", {
        userId: userIdNum,
        username,
        isTyping
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Chat socket disconnected: ${username} (${reason})`);
    });
  });
}
