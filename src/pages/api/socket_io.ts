// 소켓 서버

import { Server } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '../../types/next'

// import { Server as IOServer } from 'socket.io';
import { setIO } from '@/lib/socketInstance';


export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('✅ Socket.IO 서버 초기화')

    const io = new Server(res.socket.server, {
      path: "/api/socket_io",
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    setIO(io);
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('✅ 클라이언트 소켓 연결됨:', socket.id)

      // 방 입장
      socket.on("joinRoom", ({ roomSocketId }) => {
        socket.join(roomSocketId);
        console.log(`🔒 ${socket.id}가 방 ${roomSocketId}에 입장`);
      });

      // 방 퇴장
      socket.on("leaveRoom", ({ roomSocketId }) => {
        socket.leave(roomSocketId);
        console.log(`🚪 ${socket.id}가 방 ${roomSocketId}에서 나감`);
      });
      
      // 좋아요 변동
      socket.on('updateLikes', ({ roomId, questionId, likes }) => {
        // 같은 방 사용자에게 좋아요 수 전송
        io.to(roomId).emit('updateLikes', { questionId, likes });
      });      

      // 방 삭제 (강연자)
      socket.on("closeRoom", ({ roomSocketId }) => {
        console.log(`❌ 방 종료 요청 - ${roomSocketId}`);
        io.to(roomSocketId).emit("roomClosed");
      });

    })
  }
  res.end()
}