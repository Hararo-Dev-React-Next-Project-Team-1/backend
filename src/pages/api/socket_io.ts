// 소켓 서버

import { Server } from 'socket.io'
import { NextApiRequest } from 'next'
import { NextApiResponseServerIO } from '../../types/next'
import { prisma } from '@/lib/prisma';

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

      // 새로운 질문 broadcast
      socket.on('sendQuestion', async ({ roomId }) => {
        try {
          // 최신 질문 하나만 가져오기
          const latest = await prisma.question.findFirst({
            where: { room_id: Number(roomId) },
            orderBy: { created_at: 'desc' },
          });

          if (!latest) return; // 질문이 하나도 없으면 그냥 종료

          const responseBody = {
            room_id: latest.room_id.toString(),
            question_id: latest.question_id.toString(),
            creator_id: latest.creator_id,
            created_at: latest.created_at,
            text: latest.text,
            likes: latest.likes.toString(),
            is_selected: latest.is_selected,
          };

          // 같은 방(roomId)에 들어와 있는 모든 사용자에게 이벤트로 질문을 전송
          io.to(roomId).emit('receiveQuestion', responseBody);
        } catch (e) {
          console.error('❌ 소켓 broadcast 실패:', e);
        }
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