import { FastifyInstance } from "fastify";
import { z } from "zod";
import { AppDataSource } from "../database";
import { Tournament, TournamentParticipant, Match } from "../entities/Tournament";
import { User } from "../entities/User";
import { getIO } from "../sockets";
import { Not } from "typeorm";

const IdParams = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

export default async function tournamentRoutes(fastify: FastifyInstance) {
  fastify.addHook("preHandler", async (req, reply) => {
    try {
      const payload = (await (req as any).jwtVerify()) as {
        userId: number;
        username?: string;
      };
      (req as any).user = payload;
    } catch {
      return reply.code(401).send({ error: "Unauthorized" });
    }
  });

  fastify.get("/", async () => {
    const repo = AppDataSource.getRepository(Tournament);
    const tournaments = await repo.find({
      where: { status: Not("finished") },
      relations: ["createdBy", "participants", "matches"],
    });
    return { tournaments, count: tournaments.length };
  });

  fastify.post("/", async (request, reply) => {
    const { name, maxParticipants } = request.body as {
      name: string;
      maxParticipants: number;
    };
    const meId = (request as any).user.userId;

    const repo = AppDataSource.getRepository(Tournament);
    const userRepo = AppDataSource.getRepository(User);

    const me = await userRepo.findOneBy({ id: meId });
    if (!me) return reply.code(404).send({ error: "User not found" });

    const tournament = repo.create({
      name,
      maxParticipants,
      createdBy: me,
    });
    await repo.save(tournament);

    const io = getIO();
    io.emit("tournament:created", {
      id: tournament.id,
      name: tournament.name,
      maxParticipants,
      createdBy: me.username,
    });

    return reply.code(201).send({ tournament });
  });

  fastify.post("/:id/join", async (request, reply) => {
    const { id: tournamentId } = IdParams.parse(request.params);
    const meId = (request as any).user.userId;

    const repo = AppDataSource.getRepository(Tournament);
    const partRepo = AppDataSource.getRepository(TournamentParticipant);
    const userRepo = AppDataSource.getRepository(User);

    const tournament = await repo.findOne({
      where: { id: tournamentId },
      relations: ["participants", "participants.user"],
    });
    if (!tournament) return reply.code(404).send({ error: "Turnuva bulunamadı" });

    if (tournament.participants.length >= tournament.maxParticipants) {
      return reply.code(400).send({ error: "Turnuva dolu" });
    }

    if (tournament.participants.some((p) => p.user.id === meId)) {
      return reply.code(409).send({ error: "Zaten katıldınız" });
    }

    const me = await userRepo.findOneBy({ id: meId });
    if (!me) return reply.code(404).send({ error: "User not found" });

    const participant = partRepo.create({ tournament, user: me });
    await partRepo.save(participant);

    const io = getIO();
    io.emit("tournament:joined", {
      tournamentId,
      userId: meId,
      username: me.username,
    });

    return { message: "Katıldınız", tournamentId };
  });

  fastify.post("/:id/start", async (request, reply) => {
    const { id: tournamentId } = IdParams.parse(request.params);
    const meId = (request as any).user.userId;

    const repo = AppDataSource.getRepository(Tournament);
    const tournament = await repo.findOne({
      where: { id: tournamentId },
      relations: ["createdBy", "participants"],
    });

    if (!tournament) return reply.code(404).send({ error: "Turnuva bulunamadı" });
    if (tournament.createdBy.id !== meId) {
      return reply.code(403).send({ error: "Sadece kurucu başlatabilir" });
    }

    tournament.status = "ongoing";
    await repo.save(tournament);

    const io = getIO();
    io.emit("tournament:started", { tournamentId });

    return { message: "Turnuva başladı", tournamentId };
  });

  fastify.get("/my-matches", async (request, _reply) => {
    const meId = (request as any).user.userId;

    const matchRepo = AppDataSource.getRepository(Match);

    const matches = await matchRepo.find({
      where: [
        { player1: { user: { id: meId } } },
        { player2: { user: { id: meId } } },
      ],
      relations: [
        "tournament",
        "player1",
        "player1.user",
        "player2",
        "player2.user",
        "winner",
        "winner.user",
      ],
      order: { id: "DESC" },
    });

    return {
      count: matches.length,
      matches: matches.map((m) => ({
        id: m.id,
        tournament: m.tournament
          ? { id: m.tournament.id, name: m.tournament.name }
          : null,
        player1: m.player1?.user?.username ?? "—",
        player2: m.player2?.user?.username ?? "—",
        winner: m.winner?.user?.username ?? "Berabere",
        score: `${m.player1Score ?? 0} - ${m.player2Score ?? 0}`,
        status: m.status,
      })),
    };
  });
}
