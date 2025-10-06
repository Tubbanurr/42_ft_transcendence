import type { Server, Socket } from "socket.io";
import crypto from "crypto";
import { GameService } from "../services/game.service";

const W = 800;
const H = 400;
const PADDLE_W = 10;
const PADDLE_H = 80;
const P1_X = 20;
const P2_X = W - PADDLE_W - 20;
const BALL_R = 8;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;
const MAX_SCORE = 5;

interface PaddleState { y: number; dir: number }
interface BallState { x: number; y: number; vx: number; vy: number }
interface GameState {
  paddles: [PaddleState, PaddleState];
  ball: BallState;
  scores: [number, number];
  finished: boolean;
  started: boolean;
  winner?: 0 | 1;
  reason?: string;
}
interface Room {
  id: string;
  players: [string, string];
  usernames: [string, string];
  gameId?: number;
  state: GameState;
}

const queue: string[] = [];
const rooms = new Map<string, Room>();

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

async function createRoom(p1: Socket, p2: Socket): Promise<Room> {
  const id = "two-" + crypto.randomBytes(6).toString("hex");
  
  const player1Username = (p1.data as any)?.username || "Oyuncu 1";
  const player2Username = (p2.data as any)?.username || "Oyuncu 2";
  
  try {
    const game = await GameService.createTwoPlayerGame(player1Username, player2Username);
    
    const room: Room = {
      id,
      players: [p1.id, p2.id],
      usernames: [player1Username, player2Username],
      gameId: game.id,
      state: initialState(),
    };
    rooms.set(id, room);
    return room;
  } catch (error) {
    console.error("Oyun oluşturulurken hata:", error);
    const room: Room = {
      id,
      players: [p1.id, p2.id],
      usernames: [player1Username, player2Username],
      state: initialState(),
    };
    rooms.set(id, room);
    return room;
  }
}

function clamp(y: number) 
{
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

async function finishRoom(io: Server, room: Room, winner: 0 | 1 | null, reason: string) {
  room.state.finished = true;
  room.state.winner = winner ?? undefined;
  room.state.reason = reason;
  
  console.log(`🎮 FinishRoom çağrıldı:`);
  console.log(`🎮 Room ID: ${room.id}`);
  console.log(`🎮 Game ID: ${room.gameId}`);
  console.log(`🎮 Winner: ${winner}`);
  console.log(`🎮 Room players: [${room.players[0]}, ${room.players[1]}]`);
  console.log(`🎮 Room usernames: [${room.usernames[0]}, ${room.usernames[1]}]`);
  console.log(`🎮 Final scores: [${room.state.scores[0]}, ${room.state.scores[1]}]`);
  
  if (room.gameId) {
    try {
      const scores = room.state.scores;
      console.log(`🏓 Oyun bitiş durumu - Room ID: ${room.id}, Game ID: ${room.gameId}`);
      console.log(`🏓 Skorlar: [${scores[0]}, ${scores[1]}]`);
      console.log(`🏓 Kazanan: ${winner}, Kullanıcılar: [${room.usernames[0]}, ${room.usernames[1]}]`);
      
      const winnerId = winner !== null ? 
        (winner === 0 ? room.usernames[0] : room.usernames[1]) : null;
      
      console.log(`🎮 CompleteGame'e gönderiliyor:`);
      console.log(`🎮 - gameId: ${room.gameId}`);
      console.log(`🎮 - playerOneScore (${room.usernames[0]}): ${scores[0]}`);
      console.log(`🎮 - playerTwoScore (${room.usernames[1]}): ${scores[1]}`);
      console.log(`🎮 - winnerUsername: ${winnerId}`);
      
      await GameService.completeGame(room.gameId, scores[0], scores[1], winnerId);
      console.log(`✅ Oyun tamamlandı: ${room.gameId}, Skor: ${scores[0]}-${scores[1]}, Kazanan: ${winnerId}`);
    } catch (error) {
      console.error("Oyun sonucu kaydedilirken hata:", error);
    }
  }
  
  io.to(room.id).emit("two:finished", {
    winner,
    scores: room.state.scores,
    reason,
  });
  rooms.delete(room.id);
}

export function registerTwoSocket(io: Server): void {
  io.on("connection", (socket: Socket) => {
    socket.on("two:queue", async () => {
      if (queue.length === 0) {
        queue.push(socket.id);
        socket.emit("two:queued");
        return;
      }

      const opp = queue.shift()!;
      if (socket.id === opp) {
        queue.push(socket.id);
        socket.emit("two:queued");
        return;
      }

      const oppSock = io.sockets.sockets.get(opp);
      if (!oppSock) {
        queue.push(socket.id);
        socket.emit("two:queued");
        return;
      }

      const room = await createRoom(oppSock, socket);
      socket.join(room.id);
      oppSock.join(room.id);

      io.to(room.id).emit("two:matched", {
        roomId: room.id,
        players: room.players,
        usernames: room.usernames,
        state: room.state,
      });

      let countdown = 5;
      const interval = setInterval(() => {
        io.to(room.id).emit("two:countdown", { seconds: countdown });
        countdown--;
        if (countdown < 0) {
          clearInterval(interval);
          room.state.started = true;
          io.to(room.id).emit("two:start");
        }
      }, 1000);
    });

    socket.on("two:input", ({ roomId, playerIndex, dir }) => {
      const room = rooms.get(roomId);
      if (!room || !room.state.started) return;
      if (!room.players.includes(socket.id)) return;
      room.state.paddles[playerIndex].dir = Math.max(-1, Math.min(1, dir | 0));
    });

    socket.on("two:leave", async ({ roomId , playerIndex }) => {
      const room = rooms.get(roomId);
      if (!room || room.state.finished) return;
      const winner = playerIndex === 0 ? 1 : 0;
      await finishRoom(io, room, winner, "left");
    });

    socket.on("disconnect", async () => {
      const i = queue.indexOf(socket.id);
      if (i >= 0) queue.splice(i, 1);

      for (const room of rooms.values()) {
        if (room.players.includes(socket.id) && !room.state.finished) {
          const idx = room.players.indexOf(socket.id) as 0 | 1;
          const winner = idx === 0 ? 1 : 0;
          await finishRoom(io, room, winner, "left");
        }
      }
    });
  });

  setInterval(() => {
    for (const room of rooms.values()) {
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
        if (st.ball.y >= st.paddles[0].y && st.ball.y <= st.paddles[0].y + PADDLE_H && st.ball.x >= P1_X) {
          st.ball.vx = Math.abs(st.ball.vx);
          st.ball.vy += st.paddles[0].dir * 1.2;
          st.ball.x = P1_X + PADDLE_W + BALL_R;
        } else if (st.ball.x < 0) {
          st.scores[1] += 1;
          console.log(`🎯 Skor güncellemesi: Player 2 gol attı! Yeni skorlar: [${st.scores[0]}, ${st.scores[1]}]`);
          if (st.scores[1] >= MAX_SCORE) {
            finishRoom(io, room, 1, "score").catch(console.error);
            continue;
          }
          resetBall(st, 0);
        }
      }

      if (st.ball.x + BALL_R >= P2_X) {
        if (st.ball.y >= st.paddles[1].y && st.ball.y <= st.paddles[1].y + PADDLE_H && st.ball.x <= P2_X + PADDLE_W) {
          st.ball.vx = -Math.abs(st.ball.vx);
          st.ball.vy += st.paddles[1].dir * 1.2;
          st.ball.x = P2_X - BALL_R;
        } else if (st.ball.x > W) {
          st.scores[0] += 1;
          console.log(`🎯 Skor güncellemesi: Player 1 gol attı! Yeni skorlar: [${st.scores[0]}, ${st.scores[1]}]`);
          if (st.scores[0] >= MAX_SCORE) {
            finishRoom(io, room, 0, "score").catch(console.error);
            continue;
          }
          resetBall(st, 1);
        }
      }

      io.to(room.id).emit("two:state", { roomId: room.id, state: st });
    }
  }, 1000 / 60);
}
