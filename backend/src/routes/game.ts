import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GameService } from "../services/game.service";

export async function registerGameRoutes(fastify: FastifyInstance)
{
  fastify.addHook("preHandler", async (req, reply) => {
    const auth =
      req.headers.authorization?.split(" ")[1] ||
      (req.body as any)?.token ||
      (req.query as any)?.token;

    if (!auth) {
      reply.code(401).send({ message: "No token" });
      return;
    }

    try {
      const payload: any = (fastify as any).jwt.verify(auth);
      (req as any).user = { id: payload.id, username: payload.username };
    } catch {
      reply.code(401).send({ message: "Invalid token" });
      return;
    }
  });

  fastify.post("/", async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user as { id: number };
    const game = await GameService.createGame(user.id);
    reply.send({ roomCode: game.roomCode, gameId: game.id, status: game.status });
  });

  fastify.post("/join", async (req: FastifyRequest<{ Body: { roomCode: string } }>, reply: FastifyReply) => {
    const user = (req as any).user as { id: number };
    const { roomCode } = req.body;
    if (!roomCode) return reply.code(400).send({ message: "roomCode required" });

    try {
      const game = await GameService.joinGameByCode(user.id, roomCode);
      reply.send({ roomCode: game.roomCode, gameId: game.id, status: game.status, hostId: game.hostId, guestId: game.guestId });
    } catch (e: any) {
      reply.code(400).send({ message: e.message || "Join failed" });
    }
  });

  fastify.get("/:roomCode", async (req: FastifyRequest<{ Params: { roomCode: string } }>, reply: FastifyReply) => {
    const { roomCode } = req.params;
    const game = await GameService.getByCode(roomCode);
    if (!game) return reply.code(404).send({ message: "Not found" });
    reply.send(game);
  });

  fastify.post("/:gameId/start", async (req: FastifyRequest<{ Params: { gameId: string } }>, reply: FastifyReply) => {
    const { gameId } = req.params;
    try {
      await GameService.startGame(parseInt(gameId));
      reply.send({ message: "Game started" });
    } catch (e: any) {
      reply.code(400).send({ message: e.message || "Failed to start game" });
    }
  });

  fastify.post("/:gameId/finish", async (req: FastifyRequest<{ 
    Params: { gameId: string }, 
    Body: { hostScore: number, guestScore: number } 
  }>, reply: FastifyReply) => {
    const { gameId } = req.params;
    const { hostScore, guestScore } = req.body;
    
    if (typeof hostScore !== 'number' || typeof guestScore !== 'number') {
      return reply.code(400).send({ message: "hostScore and guestScore are required" });
    }

    try {
      const game = await GameService.finishGame(parseInt(gameId), hostScore, guestScore);
      reply.send({ message: "Game finished", game });
    } catch (e: any) {
      reply.code(400).send({ message: e.message || "Failed to finish game" });
    }
  });

  fastify.get("/history/me", async (req: FastifyRequest<{ 
    Querystring: { page?: string, limit?: string } 
  }>, reply: FastifyReply) => {
    const user = (req as any).user as { id: number };
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");

    try {
      const result = await GameService.getMatchHistory(user.id, page, limit);
      reply.send(result);
    } catch (e: any) {
      reply.code(500).send({ message: e.message || "Failed to get match history" });
    }
  });

  fastify.get("/stats/me", async (req: FastifyRequest, reply: FastifyReply) => {
    const user = (req as any).user as { id: number };

    try {
      const stats = await GameService.getGameStats(user.id);
      reply.send(stats);
    } catch (e: any) {
      reply.code(500).send({ message: e.message || "Failed to get game stats" });
    }
  });
}
