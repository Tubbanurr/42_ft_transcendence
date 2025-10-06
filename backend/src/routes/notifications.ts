import { FastifyInstance } from "fastify";
import { z } from "zod";
import { notificationsDb } from "../db.js";

const IdParams = z.object({
  id: z.coerce.number().int().positive(),
});

export default async function notificationsRoutes(fastify: FastifyInstance) 
{
  fastify.addHook("preHandler", async (req, reply) => {
    try {
      const payload = await (req as any).jwtVerify() as { userId: number };
      (req as any).user = payload;
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  fastify.get("/", async (request) => {
    const userId = (request as any).user.userId;
    const notifs = await notificationsDb.getAll(userId);
    return { notifications: notifs };
  });

  fastify.post("/:id/read", async (request) => {
    const { id } = IdParams.parse(request.params);
    await notificationsDb.markAsRead(id);
    return { success: true };
  });

  fastify.get("/unread-count", async (request) => {
    const userId = (request as any).user.userId;
    const count = await notificationsDb.countUnread(userId);
    return { unread: count };
  });

  fastify.post("/mark-all-read", async (request) => {
    const userId = (request as any).user.userId;
    await notificationsDb.markAllAsRead(userId);
    return { success: true };
  });
}
