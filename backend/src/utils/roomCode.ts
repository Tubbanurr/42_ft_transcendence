import { AppDataSource } from "../database";
import { Game } from "../entities/Game";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export async function generateUniqueRoomCode(): Promise<string> {
  const repo = AppDataSource.getRepository(Game);
  for (let i = 0; i < 10; i++) {
    const code = randomCode(6);
    const exists = await repo.exist({ where: { roomCode: code } });
    if (!exists) return code;
  }
  for (let i = 0; i < 20; i++) {
    const code = randomCode(8);
    const exists = await repo.exist({ where: { roomCode: code } });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique room code");
}
