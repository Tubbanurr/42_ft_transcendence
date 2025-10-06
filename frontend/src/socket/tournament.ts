import type { TournamentDTO } from "../pages/tournament/tournament.types";
import { socket } from "./client";

function ensure() {
  if (!socket) throw new Error("Socket not initialized. Call initGlobalSocket() first.");
  return socket;
}

type Events = {
  onCreated?: (t: TournamentDTO) => void;
  onUpdated?: (t: TournamentDTO) => void;
  onStarted?: (t: TournamentDTO) => void;
  onError?: (msg: string) => void;
  onRoomFull?: (data: { tournamentId: number; tournamentName: string; message: string }) => void;

  onMatchAssigned?: (data: { tournamentId: number; roomCode: string; players: { p1: string; p2: string } }) => void;
  onMatchCountdown?: (data: { roomCode: string; seconds: number }) => void;
  onMatchStart?: (roomCode: string) => void;
  onMatchState?: (data: { roomCode: string; state: any }) => void;
    onMatchFinished?: (data: { 
    roomCode: string; 
    winner?: 0 | 1; 
    winnerName?: string | null;
    usernames: [string, string];
    scores: [number, number]; 
    reason: string ;
    hasNextMatch: boolean;
  }) => void;
};

export function registerTournamentEvents(events: Events) {
  const s = ensure();

  s.off("connect_error").on("connect_error", (err) => {
    events.onError?.(err.message);
  });

  s.off("tournament:created").on("tournament:created", (t: TournamentDTO) => {
    events.onCreated?.(t);
  });
  s.off("tournament:updated").on("tournament:updated", (t: TournamentDTO) => {
    events.onUpdated?.(t);
  });
  s.off("tournament:started").on("tournament:started", (t: TournamentDTO) => {
    events.onStarted?.(t);
  });

  s.off("match:assigned").on("match:assigned", (data) => {
    events.onMatchAssigned?.(data);
  });
  s.off("match:countdown").on("match:countdown", (data) => {
    events.onMatchCountdown?.(data);
  });
  s.off("match:start").on("match:start", (roomCode: string) => {
    events.onMatchStart?.(roomCode);
  });
  s.off("match:state").on("match:state", (data) => {
    events.onMatchState?.(data);
  });
  s.off("match:finished").on("match:finished", (data) => {
    events.onMatchFinished?.(data);
  });
}

export function listTournaments(): Promise<TournamentDTO[]> {
  return new Promise((resolve, reject) => {
    ensure().emit("tournament:list", (res: any) => {
      if (res?.success) resolve(res.tournaments as TournamentDTO[]);
      else reject(new Error(res?.message ?? "list failed"));
    });
  });
}

export function createTournament(payload: { name: string; maxPlayers: number; description?: string; }): Promise<TournamentDTO> {
  return new Promise((resolve, reject) => {
    ensure().emit("tournament:create", payload, (res: any) => {
      if (res?.success) resolve(res.tournament as TournamentDTO);
      else reject(new Error(res?.message ?? "create failed"));
    });
  });
}

export function joinTournament(id: number): Promise<TournamentDTO> {
  return new Promise((resolve, reject) => {
    ensure().emit("tournament:join", { id }, (res: any) => {
      if (res?.success) resolve(res.tournament as TournamentDTO);
      else reject(new Error(res?.message ?? "join failed"));
    });
  });
}

export function startTournament(id: number): Promise<TournamentDTO> {
  return new Promise((resolve, reject) => {
    ensure().emit("tournament:start", { id }, (res: any) => {
      if (res?.success) resolve(res.tournament as TournamentDTO);
      else reject(new Error(res?.message ?? "start failed"));
    });
  });
}

export function joinMatch(roomCode: string): Promise<{ roomId: string; playerIndex: 0 | 1; state: any; usernames: [string, string] }> {
  return new Promise((resolve, reject) => {
    ensure().emit("match:join", { roomCode }, (res: any) => {
      if (res?.success) resolve(res);
      else reject(new Error(res?.message ?? "join match failed"));
    });
  });
}

export function sendMatchInput(roomCode: string, playerIndex: 0 | 1, dir: number) {
  ensure().emit("match:input", { roomCode, playerIndex, dir });
}

export function leaveMatch(roomCode: string) {
  ensure().emit("match:leave", { roomCode });
}
