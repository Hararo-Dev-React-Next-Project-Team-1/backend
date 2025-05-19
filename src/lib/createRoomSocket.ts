// src/lib/createRoomSocket.ts
import socket from './socket';

export function createRoomSocket(roomSocketId: string) {
  fetch('/api/socket'); // 소켓 서버 초기화

  if (!socket.connected) {
    socket.connect();
  }

  socket.on('connect', () => {
    console.log('[Client] Connected to socket:', socket.id);
    socket.emit('join', roomSocketId);
  });
}
