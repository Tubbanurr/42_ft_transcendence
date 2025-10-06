import type { Server, Socket } from "socket.io";
import { setUserSocket, removeUserSocket } from "./connections.store";
import { friendsDb } from "@/db"; 

const connectedUsers = new Map<string, string>();

export function registerFriendSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    const user = socket.data.user;
    if (user) {
      setUserSocket(String(user.id), socket.id);
      console.log(`✅ User connected: ${user.username} (${user.id}) socketId=${socket.id}`);
    }

    socket.on("friend:add", ({ toUserId }: { toUserId: string }) => {
      const targetSocketId = connectedUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request:received", {
          fromUserId: String(user.id),
          fromUsername: user.username,
        });
        console.log(`📨 Friend request from ${user.username} -> ${toUserId}`);
      }
    });

    socket.on("friend:accept", ({ toUserId }: { toUserId: string }) => {
      const targetSocketId = connectedUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:request:accepted", {
          fromUserId: String(user.id),
          fromUsername: user.username,
        });
        console.log(`🤝 ${user.username} accepted request from ${toUserId}`);
      }
    });

    socket.on("friend:removed", ({ toUserId }: { toUserId: string }) => {
      const targetSocketId = connectedUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit("friend:removed", {
          fromUserId: String(user.id),
          fromUsername: user.username,
        });
        console.log(`❌ ${user.username} removed friend ${toUserId}`);
      }
    });
    socket.on("friend:block", async ({ toUserId }: { toUserId: string }) => {
      try {
        await friendsDb.block(Number(toUserId), Number(user.id));

        const targetSocketId = connectedUsers.get(String(toUserId));

        io.to(socket.id).emit("friend:blocked", {
          fromUserId: String(user.id),
          fromUsername: user.username,
          targetUserId: toUserId,
          type: "self",
        });

        if (targetSocketId) {
          io.to(targetSocketId).emit("friend:blocked", {
            fromUserId: String(user.id),
            fromUsername: user.username,
            targetUserId: toUserId,
            type: "other",
          });
        }

        console.log(`🚫 ${user.username} (${user.id}) blocked ${toUserId}`);
      } catch (err) {
        console.error("❌ Block işleminde hata:", err);
        io.to(socket.id).emit("friend:block:error", {
          message: "Block işlemi başarısız",
        });
      }
    });

    socket.on("disconnect", () => {
      if (user) removeUserSocket(String(user.id));
    });
  });
}
