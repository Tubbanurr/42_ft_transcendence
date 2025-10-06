import { io, Socket } from "socket.io-client";
import { Config } from "../config";

let socket: Socket | null = null;
let currentSocketId: string | null = null;

export function initGlobalSocket(token: string) {
  if (!socket) {
    const serverUrl = Config.SOCKET_URL;
    console.log("🔌 [Socket] Connecting to:", serverUrl);
    Config.logConfig();

    socket = io(serverUrl, {
      path: Config.WS_PATH,
      auth: { token },
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.on("connect", () => {
      currentSocketId = socket!.id || null;
      console.log("🔌 connected", currentSocketId);
    });

    socket.on("disconnect", (reason: any) => {
      console.log("🔌 Global socket disconnected:", reason);
    });

    socket.on("connect_error", (err: any) => {
      console.error("❌ Global socket error:", err.message);
    });
  }

  socket.off("two:queued").on("two:queued");
  socket.off("two:matched").on("two:matched");
  socket.off("two:state").on("two:state");
  socket.off("two:left").on("two:left");
  socket.off("two:finished").on("two:finished");
  socket.off("two:countdown").on("two:countdown");
  socket.off("two:start").on("two:start");

  return socket;
}

export function ensureSocket(): Socket {
  if (!socket) {
    throw new Error("Socket not initialized. Call initGlobalSocket() first.");
  }
  return socket;
}

export function startTwoPlayers() {
  const s = ensureSocket();
  s.emit("two:start");
  s.emit("two:queue");
}

export function sendInput(roomId: string, playerIndex: number, dir: -1 | 0 | 1) {
  ensureSocket().emit("two:input", { roomId, playerIndex, dir });
}

export function sendMove(roomId: string, y: number, playerIndex: number) {
  ensureSocket().emit("two:move", { roomId, playerIndex, y });
}

export function leaveTwoPlayers(roomId: string, playerIndex: number) {
  ensureSocket().emit("two:leave", { roomId, playerIndex });
}

export function getSocketId() {
  return currentSocketId;
}

type ChatEvents = {
  onMessage?: (msg: any) => void;
  onHistory?: (data: any) => void;
  onTyping?: (data: any) => void;
  onError?: (msg: string) => void;
};

export function registerChatEvents(events: ChatEvents) {
  const s = ensureSocket();

  s.off("privateMessage").on("privateMessage", (msg) => events.onMessage?.(msg));
  s.off("conversationHistory").on("conversationHistory", (data) => events.onHistory?.(data));
  s.off("userTyping").on("userTyping", (data) => events.onTyping?.(data));
  s.off("messageError").on("messageError", ({ error }) => events.onError?.(error));
}

export function sendPrivateMessage(receiverId: number, content: string) {
  ensureSocket().emit("privateMessage", { receiverId, content });
}

export function joinConversation(friendId: number) {
  ensureSocket().emit("joinConversation", { friendId });
}

export function sendTyping(friendId: number, isTyping: boolean) {
  ensureSocket().emit("typing", { friendId, isTyping });
}


export function disconnectSocket() {
  if (socket) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null;
    currentSocketId = null;
  }
}

type TournamentEvents = {
  onTournamentFull?: (data: { tournamentId: number; tournamentName: string; message: string }) => void;
  onTournamentUpdated?: (tournament: any) => void;
  onTournamentStarted?: (tournament: any) => void;
};

export function registerTournamentEvents(events: TournamentEvents) {
  const s = ensureSocket();

  s.off("tournament:full").on("tournament:full", (data) => events.onTournamentFull?.(data));
  s.off("tournament:updated").on("tournament:updated", (tournament) => events.onTournamentUpdated?.(tournament));
  s.off("tournament:started").on("tournament:started", (tournament) => events.onTournamentStarted?.(tournament));
}

export { socket };
