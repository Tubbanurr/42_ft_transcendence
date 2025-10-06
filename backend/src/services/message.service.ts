import { messagesDb, notificationsDb } from "../db.js";
import { AppDataSource } from "../database.js";
import { User } from "../entities/User.js";

export class MessageService {

  async sendMessage(senderId: number, receiverId: number, content: string) {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const sender = await userRepo.findOneBy({ id: senderId });
      const receiver = await userRepo.findOneBy({ id: receiverId });
      
      if (!sender || !receiver) {
        throw new Error("Sender or receiver not found");
      }

      const message = await messagesDb.send(senderId, receiverId, content);
      
      await notificationsDb.create(receiverId, "message", `${sender.display_name || sender.username} tarafından yeni mesaj`);
      
      return {
        ...message,
        sender: {
          id: sender.id,
          username: sender.username,
          displayName: sender.display_name,
          avatarUrl: sender.avatar_url
        }
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async getConversation(userId: number, friendId: number) {
    try {
      const messages = await messagesDb.getConversation(userId, friendId);
      
      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        where: [{ id: userId }, { id: friendId }],
        select: ['id', 'username', 'display_name', 'avatar_url']
      });
      
      const userMap = new Map(users.map(u => [u.id, u]));
      
      const enrichedMessages = messages.map(msg => {
        const sender = userMap.get(msg.senderId);
        return {
          ...msg,
          sender: sender ? {
            id: sender.id,
            username: sender.username,
            displayName: sender.display_name,
            avatarUrl: sender.avatar_url
          } : null
        };
      });
      
      return enrichedMessages;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  }

  async markAsRead(userId: number, friendId: number) {
    try {
      return await messagesDb.markAsRead(userId, friendId);
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw error;
    }
  }

  async getUnreadCount(userId: number) {
    try {
      return await messagesDb.countUnread(userId);
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }
}

export const messageService = new MessageService();