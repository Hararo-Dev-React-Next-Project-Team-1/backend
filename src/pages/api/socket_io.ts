// 소켓 서버

import { Server } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '../../types/next'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Socket.IO 서버 초기화')

    const io = new Server(res.socket.server, {
      path: "/api/socket_io",
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

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

      // 새로운 질문 broadcast
      socket.on("sendQuestion", ({ roomSocketId, content }) => {
        // console.log(`📨 질문 도착 - 방: ${roomSocketId}, 내용: ${content}`);
        console.log(`📨 질문 도착 - 방: ${roomSocketId}, 내용: ${JSON.stringify(content)}`);
        io.to(roomSocketId).emit("receiveQuestion", content);
      });

      // 방 삭제 (강연자)
      socket.on("closeRoom", ({ roomSocketId }) => {
        console.log(`❌ 방 종료 요청 - ${roomSocketId}`);
        io.to(roomSocketId).emit("roomClosed");
      });

      socket.on("disconnect", (reason) => {
        console.log("❌ 연결 종료:", socket.id, "원인:", reason);
      });
    })
  }
  res.end()
}