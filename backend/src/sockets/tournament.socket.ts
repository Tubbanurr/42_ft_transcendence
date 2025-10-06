import type { Server as IOServer, Socket as IOSocket } from "socket.io";
import { AppDataSource } from "../database";
import { Tournament, TournamentParticipant, Match } from "../entities/Tournament";
import { User } from "../entities/User";
import { randomUUID } from "crypto";
import { createTournamentGameRoom } from "./turnuva.two.socket";

function ensureAuth(socket: IOSocket): { userId: number; username?: string } {
  const userId = (socket.data as any).userId as number | undefined;
  const username = (socket.data as any).username as string | undefined;
  if (!userId) throw new Error("UNAUTHORIZED");
  return { userId, username };
}

const tournamentRelations = [
  "createdBy",
  "participants",
  "participants.user",
  "matches",
  "matches.player1",
  "matches.player1.user",
  "matches.player2",
  "matches.player2.user",
  "matches.winner",
  "matches.winner.user",
];
import { Not } from "typeorm";

export function registerTournamentSocket(io: IOServer) {
  io.on("connection", (socket: IOSocket) => {
    console.log("🔌 Yeni socket bağlandı:", socket.id);

    socket.on("tournament:list", async (cb?: (res: any) => void) => {
      try {
        const repo = AppDataSource.getRepository(Tournament);
        const tournaments = await repo.find({
          where: { status: Not("finished") },
          relations: tournamentRelations,
        });
        cb?.({ success: true, tournaments });
      } catch (e: any) {
        cb?.({ success: false, message: e.message });
      }
    });

    socket.on("tournament:create", async (payload, cb?: (res: any) => void) => {
      try {
        const { userId } = ensureAuth(socket);

        const userRepo = AppDataSource.getRepository(User);
        const tRepo = AppDataSource.getRepository(Tournament);
        const pRepo = AppDataSource.getRepository(TournamentParticipant);

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) return cb?.({ success: false, message: "User not found" });

        const t = tRepo.create({
          name: payload.name,
          maxParticipants: payload.maxPlayers,
          createdBy: user,
          status: "pending",
        });
        await tRepo.save(t);

        const part = pRepo.create({ tournament: t, user });
        await pRepo.save(part);

        const tournamentWithRelations = await tRepo.findOne({
          where: { id: t.id },
          relations: tournamentRelations,
        });

        io.emit("tournament:created", tournamentWithRelations);
        cb?.({ success: true, tournament: tournamentWithRelations });
      } catch (e: any) {
        cb?.({ success: false, message: e.message });
      }
    });

    socket.on("tournament:join", async ({ id }, cb?: (res: any) => void) => {
      try {
        const { userId } = ensureAuth(socket);

        const repo = AppDataSource.getRepository(Tournament);
        const partRepo = AppDataSource.getRepository(TournamentParticipant);
        const userRepo = AppDataSource.getRepository(User);

        const t = await repo.findOne({ where: { id }, relations: tournamentRelations });
        if (!t) return cb?.({ success: false, message: "Turnuva bulunamadı" });

        if (t.participants.length >= t.maxParticipants)
          return cb?.({ success: false, message: "Turnuva dolu" });

        if (t.participants.some((p) => p.user.id === Number(userId)))
          return cb?.({ success: false, message: "Zaten katıldınız" });

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) return cb?.({ success: false, message: "User not found" });

        const participant = partRepo.create({ user, tournament: t });
        await partRepo.save(participant);

        const updated = await repo.findOne({ where: { id: t.id }, relations: tournamentRelations });

        if (updated && updated.participants.length === updated.maxParticipants) {
          updated.participants.forEach((p) => {
            io.to(`user_${p.user.id}`).emit("tournament:full", {
              tournamentId: updated.id,
              tournamentName: updated.name,
              message: "Turnuva odası doldu. Turnuva birazdan başlıyor..."
            });
          });
        }

        io.emit("tournament:updated", updated);
        cb?.({ success: true, tournament: updated });
      } catch (e: any) {
        cb?.({ success: false, message: e.message });
      }
    });

    socket.on("tournament:start", async ({ id }, cb?: (res: any) => void) => {
      try {
        const { userId } = ensureAuth(socket);

        const repo = AppDataSource.getRepository(Tournament);
        const matchRepo = AppDataSource.getRepository(Match);

        const t = await repo.findOne({
          where: { id },
          relations: ["createdBy", "participants", "participants.user"],
        });

        if (!t) return cb?.({ success: false, message: "Turnuva bulunamadı" });
        if (t.createdBy.id !== Number(userId))
          return cb?.({ success: false, message: "Sadece kurucu başlatabilir" });
        if (t.participants.length < t.maxParticipants)
          return cb?.({ success: false, message: "Yetersiz oyuncu" });

        t.status = "ongoing";
        t.currentRound = 1;
        await repo.save(t);

        const shuffled = [...t.participants].sort(() => Math.random() - 0.5);
        const matches: Match[] = [];

        for (let i = 0; i < shuffled.length; i += 2) {
          const p1 = shuffled[i];
          const p2 = shuffled[i + 1];

          const match = matchRepo.create({
            tournament: t,
            round: 1,
            player1: p1,
            player2: p2,
            status: p2 ? "pending" : "finished",
            roomCode: randomUUID(),
          });

          await matchRepo.save(match);
          matches.push(match);
        }

        const updated = await repo.findOne({ where: { id: t.id }, relations: tournamentRelations });

        matches.forEach((m) => {
          if (m.player1 && m.player2) {
            createTournamentGameRoom({
              io,
              roomCode: m.roomCode ?? "",
              matchId: m.id,
              p1UserId: m.player1.user.id,
              p2UserId: m.player2.user.id,
              p1Name: m.player1.user.username ?? "Oyuncu 1",
              p2Name: m.player2.user.username ?? "Oyuncu 2",
            });
          }
        });

        matches.forEach((m) => {
          [m.player1, m.player2].forEach((p) => {
            if (!p) return;
            const playerSocket = Array.from(io.sockets.sockets.values()).find(
              (s) => Number((s.data as any).userId) === p.user.id
            );
            if (playerSocket) {
              playerSocket.emit("match:assigned", {
                tournamentId: t.id,
                roomCode: m.roomCode,
                players: {
                  p1: m.player1?.user.username ?? "Oyuncu 1",
                  p2: m.player2?.user.username ?? "Oyuncu 2",
                },
              });
            }
          });
        });

        io.emit("tournament:started", updated);
        cb?.({ success: true, tournament: updated });
      } catch (e: any) {
        cb?.({ success: false, message: e.message });
      }
    });
  });
}
