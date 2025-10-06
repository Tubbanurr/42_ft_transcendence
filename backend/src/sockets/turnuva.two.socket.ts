import type { Server, Socket } from "socket.io";
import { AppDataSource } from "../database";
import { Match, Tournament } from "../entities/Tournament";
import { randomUUID } from "crypto";

const W = 800, H = 400, PADDLE_W = 10, PADDLE_H = 80;
const P1_X = 20, P2_X = W - PADDLE_W - 20, BALL_R = 8;
const PADDLE_SPEED = 5, BALL_SPEED = 4, MAX_SCORE = 5;

type PaddleState = { y: number; dir: number };
type BallState = { x: number; y: number; vx: number; vy: number };
type GameState = {
  paddles: [PaddleState, PaddleState];
  ball: BallState;
  scores: [number, number];
  finished: boolean;
  started: boolean;
  winner?: 0 | 1;
  reason?: string;
};

type GameRoom = {
  id: string;
  roomCode: string;
  playerSockets: [string | null, string | null];
  usernames: [string, string];
  playerUserIds: [number, number];
  state: GameState;
  matchId: number;
};

const rooms = new Map<string, GameRoom>();

function initialState(): GameState {
  return {
    paddles: [
      { y: (H - PADDLE_H) / 2, dir: 0 },
      { y: (H - PADDLE_H) / 2, dir: 0 },
    ],
    ball: { x: W / 2, y: H / 2, vx: BALL_SPEED, vy: BALL_SPEED * 0.6 },
    scores: [0, 0],
    finished: false,
    started: false,
  };
}

function clamp(y: number) {
  return Math.max(0, Math.min(H - PADDLE_H, y));
}

function resetBall(st: GameState, towards: 0 | 1) {
  st.ball.x = W / 2;
  st.ball.y = H / 2;
  const dir = towards === 0 ? -1 : 1;
  const angle = Math.random() * 0.6 - 0.3;
  st.ball.vx = dir * BALL_SPEED * (1 + Math.random() * 0.2);
  st.ball.vy = BALL_SPEED * Math.sin(angle);
}

export async function advanceTournament(io: Server, tournament: Tournament) {
  const tRepo = AppDataSource.getRepository(Tournament);
  const matchRepo = AppDataSource.getRepository(Match);

  const lastRound = tournament.currentRound;
  const winners = tournament.matches
    .filter((m) => m.round === lastRound && m.winner)
    .map((m) => m.winner!);

  if (winners.length <= 1) {
    tournament.status = "finished";
    await tRepo.save(tournament);
    io.emit("tournament:updated", tournament);
    console.log(`🏆 Turnuva bitti! Winner: ${winners[0]?.user?.username}`);
    return;
  }

  tournament.currentRound = (tournament.currentRound ?? 1) + 1;
  await tRepo.save(tournament);

  const newMatches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const p1 = winners[i];
    const p2 = winners[i + 1];

    const match = matchRepo.create({
      tournament,
      round: tournament.currentRound,
      player1: p1,
      player2: p2,
      status: p2 ? "pending" : "finished",
      roomCode: randomUUID(),
    });

    await matchRepo.save(match);
    newMatches.push(match);

    if (p1 && p2) {
      createTournamentGameRoom({
        io,
        roomCode: match.roomCode ?? "",
        matchId: match.id,
        p1UserId: p1.user.id,
        p2UserId: p2.user.id,
        p1Name: p1.user.username,
        p2Name: p2.user.username,
      });
    }
  }

  const updated = await tRepo.findOne({
    where: { id: tournament.id },
    relations: [
      "matches",
      "matches.player1",
      "matches.player1.user",
      "matches.player2",
      "matches.player2.user",
      "matches.winner",
      "matches.winner.user",
      "participants",
      "participants.user",
    ],
  });

  io.emit("tournament:updated", updated);
  console.log(`➡️ Yeni round başladı: round=${tournament.currentRound}`);

  newMatches.forEach((m) => {
    if (!m.player1 || !m.player2) return;
    const targets = [m.player1.user.id, m.player2.user.id];
    for (const s of io.sockets.sockets.values()) {
      const uid = Number((s.data as any)?.userId);
      if (targets.includes(uid)) {
        s.emit("match:assigned", {
          tournamentId: tournament.id,
          roomCode: m.roomCode,
          players: {
            p1: m.player1.user.username ?? "Oyuncu 1",
            p2: m.player2.user.username ?? "Oyuncu 2",
          },
        });
      }
    }
  });
}

export function createTournamentGameRoom(params: {
  io: Server;
  roomCode: string;
  matchId: number;
  p1UserId: number;
  p2UserId: number;
  p1Name: string;
  p2Name: string;
}) {
  const id = `t-${params.roomCode}`;
  if (rooms.has(id)) return rooms.get(id)!;

  console.log(`🎮 Creating new room: ${id}`);

  const room: GameRoom = {
    id,
    roomCode: params.roomCode ?? "",
    matchId: params.matchId,
    playerSockets: [null, null],
    usernames: [params.p1Name || "Oyuncu 1", params.p2Name || "Oyuncu 2"],
    playerUserIds: [params.p1UserId, params.p2UserId],
    state: initialState(),
  };
  rooms.set(id, room);
  return room;
}

async function finishAndPersist(io: Server, room: GameRoom, winner: 0 | 1 | null, reason: string) {
  if (room.state.finished) return;
  room.state.finished = true;
  room.state.winner = winner ?? undefined;
  room.state.reason = reason;
  let hasNextMatch = false;
  console.log(`🏁 Match finished! room=${room.roomCode}, winner=${winner}, reason=${reason}`);

  try {
    const matchRepo = AppDataSource.getRepository(Match);
    const tRepo = AppDataSource.getRepository(Tournament);

    const match = await matchRepo.findOne({
      where: { id: room.matchId },
      relations: ["tournament", "player1", "player1.user", "player2", "player2.user", "winner"],
    });

    if (match) {
      if (winner !== null) {
        const winnerPart = winner === 0 ? match.player1 : match.player2;
        if (winnerPart) match.winner = winnerPart;
      }
      match.status = "finished";
      match.player1Score = room.state.scores[0];
      match.player2Score = room.state.scores[1];
      await matchRepo.save(match);

      const tournament = await tRepo.findOne({
        where: { id: match.tournament.id },
        relations: [
          "matches",
          "matches.player1",
          "matches.player1.user",
          "matches.player2",
          "matches.player2.user",
          "matches.winner",
          "matches.winner.user",
          "participants",
          "participants.user",
        ],
      });

      if (tournament) {
        const allFinished = tournament.matches.every((m) => m.status === "finished");
        if (allFinished) {
          await advanceTournament(io, tournament);
        }
        hasNextMatch = tournament.status !== "finished";
      }
    }
  } catch (e) {
    console.error("❌ DB save failed:", e);
  }

  io.to(room.id).emit("match:finished", {
    roomCode: room.roomCode,
    winner,
    scores: room.state.scores,
    winnerName: winner !== null ? room.usernames[winner] : null,
    usernames: room.usernames,
    reason,
    hasNextMatch: false,
  });

  if (winner !== null) {
    const winnerSocketId = room.playerSockets[winner];
    if (winnerSocketId) {
      io.to(winnerSocketId).emit("match:finished", {
        roomCode: room.roomCode,
        winner,
        scores: room.state.scores,
        winnerName: room.usernames[winner],
        usernames: room.usernames,
        reason,
        hasNextMatch,
      });
    }
  }

  rooms.delete(room.id);
}

export function registerTournamentTwoSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 New client connected:", socket.id);

    socket.on("match:join", async ({ roomCode }: { roomCode: string }, cb?: (res: any) => void) => {
      try {
        const id = `t-${roomCode}`;
        const room = rooms.get(id);
        if (!room) return cb?.({ success: false, message: "Oda bulunamadı" });

        const userId = Number((socket.data as any)?.userId);
        let playerIndex: 0 | 1 | null = null;
        if (userId === room.playerUserIds[0]) playerIndex = 0;
        else if (userId === room.playerUserIds[1]) playerIndex = 1;
        if (playerIndex === null) return cb?.({ success: false, message: "Bu maça yetkiniz yok" });

        room.playerSockets[playerIndex] = socket.id;
        socket.join(room.id);

        io.to(room.id).emit("match:player-joined", {
          roomCode,
          usernames: room.usernames,
          joined: [!!room.playerSockets[0], !!room.playerSockets[1]],
        });

        cb?.({
          success: true,
          roomId: room.id,
          playerIndex,
          usernames: room.usernames,
          state: room.state,
        });

        if (!room.state.started) {
          let countdown = 3;
          const timer = setInterval(() => {
            io.to(room.id).emit("match:countdown", { roomCode, seconds: countdown });
            countdown--;
            if (countdown < 0) {
              clearInterval(timer);
              room.state.started = true;
              io.to(room.id).emit("match:start", roomCode);
            }
          }, 1000);
        }
      } catch (e: any) {
        console.error("❌ match:join error:", e);
        cb?.({ success: false, message: e.message });
      }
    });

    socket.on("match:input", ({ roomCode, playerIndex, dir }) => {
      const room = rooms.get(`t-${roomCode}`);
      if (!room || !room.state.started || room.state.finished) return;
      if (room.playerSockets[playerIndex] !== socket.id) return;
      room.state.paddles[playerIndex].dir = Math.max(-1, Math.min(1, dir | 0));
    });

    socket.on("match:leave", async ({ roomCode }) => {
      const room = rooms.get(`t-${roomCode}`);
      if (!room || room.state.finished) return;
      const idx =
        room.playerSockets[0] === socket.id ? 0 :
        room.playerSockets[1] === socket.id ? 1 : null;
      if (idx === null) return;
      const winner = (idx === 0 ? 1 : 0) as 0 | 1;
      await finishAndPersist(io, room, winner, "left");
    });

    socket.on("disconnect", async () => {
      for (const room of rooms.values()) {
        if (room.state.finished) continue;
        const idx =
          room.playerSockets[0] === socket.id ? 0 :
          room.playerSockets[1] === socket.id ? 1 : null;
        if (idx !== null) {
          const winner = (idx === 0 ? 1 : 0) as 0 | 1;
          await finishAndPersist(io, room, winner, "left");
        }
      }
    });
  });

  setInterval(async () => {
    for (const room of Array.from(rooms.values())) {
      const st = room.state;
      if (st.finished || !st.started) continue;

      st.paddles[0].y = clamp(st.paddles[0].y + st.paddles[0].dir * PADDLE_SPEED);
      st.paddles[1].y = clamp(st.paddles[1].y + st.paddles[1].dir * PADDLE_SPEED);

      st.ball.x += st.ball.vx;
      st.ball.y += st.ball.vy;

      if (st.ball.y - BALL_R <= 0 || st.ball.y + BALL_R >= H) {
        st.ball.vy *= -1;
        st.ball.y = Math.max(BALL_R, Math.min(H - BALL_R, st.ball.y));
      }

      if (st.ball.x - BALL_R <= P1_X + PADDLE_W) {
        const hit = st.ball.y >= st.paddles[0].y &&
                    st.ball.y <= st.paddles[0].y + PADDLE_H &&
                    st.ball.x >= P1_X;
        if (hit) {
          st.ball.vx = Math.abs(st.ball.vx);
          st.ball.vy += st.paddles[0].dir * 1.2;
          st.ball.x = P1_X + PADDLE_W + BALL_R;
        } else if (st.ball.x < 0) {
          st.scores[1] += 1;
          if (st.scores[1] >= MAX_SCORE) {
            await finishAndPersist(io, room, 1, "score");
            continue;
          }
          resetBall(st, 0);
        }
      }

      if (st.ball.x + BALL_R >= P2_X) {
        const hit = st.ball.y >= st.paddles[1].y &&
                    st.ball.y <= st.paddles[1].y + PADDLE_H &&
                    st.ball.x <= P2_X + PADDLE_W;
        if (hit) {
          st.ball.vx = -Math.abs(st.ball.vx);
          st.ball.vy += st.paddles[1].dir * 1.2;
          st.ball.x = P2_X - BALL_R;
        } else if (st.ball.x > W) {
          st.scores[0] += 1;
          if (st.scores[0] >= MAX_SCORE) {
            await finishAndPersist(io, room, 0, "score");
            continue;
          }
          resetBall(st, 1);
        }
      }

      io.to(room.id).emit("match:state", {
        roomCode: room.roomCode,
        state: st,
      });
    }
  }, 1000 / 60);
}
