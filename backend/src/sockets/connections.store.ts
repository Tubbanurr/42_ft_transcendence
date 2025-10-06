const connectedUsers = new Map<string, string>();

export function setUserSocket(userId: string, socketId: string) {
  connectedUsers.set(userId, socketId);
}

export function removeUserSocket(userId: string) {
  connectedUsers.delete(userId);
}

export function getSocketIdByUserId(userId: string): string | undefined {
  return connectedUsers.get(userId);
}

export function isOnline(userId: string) {
  return connectedUsers.has(userId);
}
