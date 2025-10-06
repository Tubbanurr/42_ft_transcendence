import { ensureSocket } from "@/socket/client";

type Message = {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
};

type ChatEvents = {
  onMessage?: (msg: Message) => void;
  onHistory?: (data: { friendId: number; messages: Message[] }) => void;
  onTyping?: (data: { userId: number; isTyping: boolean }) => void;
  onError?: (msg: string) => void;
};

export function registerChatEvents(events: ChatEvents) {
  const s = ensureSocket();

  s.off("privateMessage").on("privateMessage", (msg: Message) => {
    events.onMessage?.(msg);
  });

  s.off("conversationHistory").on("conversationHistory", (data) => {
    events.onHistory?.(data);
  });

  s.off("userTyping").on("userTyping", (data) => {
    events.onTyping?.(data);
  });

  s.off("messageError").on("messageError", ({ error }) => {
    events.onError?.(error);
  });
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
