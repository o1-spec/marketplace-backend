const onlineUsers = new Map<string, string>();

export function addOnlineUser(userId: string, socketId: string) {
  onlineUsers.set(userId, socketId);
}

export function removeOnlineUser(userId: string) {
  onlineUsers.delete(userId);
}

export function isUserOnline(userId: string) {
  return onlineUsers.has(userId);
}

export function getSocketId(userId: string) {
  return onlineUsers.get(userId);
}
