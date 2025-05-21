'use client';

import { useEffect, useState } from 'react';
import socket from '@/lib/socketInstance';

type Question = {
  author: string;
  text: string;
  timestamp: string;
};

export default function RoomTestPage() {
  const [roomSocketId, setRoomSocketId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [roomClosed, setRoomClosed] = useState(false);

  // ✅ 방 입장
  const handleJoin = (code: number) => {
    const id = `room_${code}`;
    console.log("📌 방 입장 시도 - roomSocketId:", id);
    setRoomSocketId(id);

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinRoom', { roomSocketId: id });
    console.log("🚪 joinRoom emit 완료");
    setConnected(true);
    setRoomClosed(false);
  };

  // ✅ 질문 전송
  const handleSendQuestion = () => {
    if (!roomSocketId || !connected || roomClosed) return;

    const content = {
      author: '청중',
      text: '이건 테스트 질문입니다.',
      timestamp: new Date().toLocaleTimeString(),
    };

    console.log("질문 전송 버튼 클릭됨");
    console.log("roomSocketId:", roomSocketId);
    console.log("질문 내용:", content);

    socket.emit('sendQuestion', { roomSocketId, content });
  };

  // ✅ 방 닫기 (강연자 전용 기능)
  const handleCloseRoom = () => {
    if (!roomSocketId || !connected) return;
    socket.emit("closeRoom", { roomSocketId });
  };

  // ✅ 방 나가기 (사용자 전용 기능)
  const handleLeaveRoom = () => {
    if (!roomSocketId || !connected) return;
  
    socket.emit("leaveRoom", { roomSocketId }); // ✅ 서버에 나가기 요청
    setRoomSocketId(""); // 상태 초기화
    setConnected(false);
    alert("방을 나갔습니다.");
  };

  // 🔹 질문 수신용 useEffect
  useEffect(() => {
    socket.on('receiveQuestion', (q) => {
      console.log("📥 질문 수신:", q); // 이게 안 찍히면 못 받은 거임
      setQuestions((prev) => [...prev, q]);
    });

    return () => {
      socket.off('receiveQuestion');
    };
  }, []);

  // 🔹 방 닫힘 감지용 useEffect
  useEffect(() => {
    socket.on('roomClosed', () => {
      setRoomClosed(true);
      alert('⚠️ 방이 닫혔습니다.');
    });

    return () => {
      socket.off('roomClosed');
    };
  }, []);


  return (
    <div style={{ padding: 20 }}>
      <h2>🎤 소켓 기반 강연방 테스트</h2>

      {!connected && (
        <button onClick={() => handleJoin(1234)}>1️⃣방 입장</button>
      )}

      {connected && !roomClosed && (
        <>
          <p>✅ 현재 방: <strong>{roomSocketId}</strong></p>
          <button onClick={handleSendQuestion }>2️⃣ 질문 전송</button>
          <button onClick={handleLeaveRoom}> 방 나가기 </button>
          <button onClick={handleCloseRoom}>3️⃣ 방 닫기</button>
        </>
      )}

      {roomClosed && <p style={{ color: 'red' }}>⛔ 이 방은 종료되었습니다.</p>}

      <hr />
      <h4>📋 질문 목록</h4>
      <ul>
        {questions.map((q, i) => (
          <li key={i}>
            <strong>{q.author}</strong>: {q.text} <em>({q.timestamp})</em>
          </li>
        ))}
      </ul>
    </div>
  );
}


// 'use client';

// import { useState } from 'react';
// import { createRoomSocket } from '@/lib/createRoomSocket';
// import socket from '@/lib/socket';

// export default function TestRoomPage() {
//   const [code, setCode] = useState<string | null>(null);
//   const [connected, setConnected] = useState(false);

//   const handleCreate = async () => {
//     const res = await fetch('/api/rooms', { method: 'POST' });
//     const data = await res.json();
//     const roomSocketId = `room_${data.code}`;
//     setCode(roomSocketId);

//     // ✅ 소켓 연결 및 방 입장
//     createRoomSocket(roomSocketId);

//     // ✅ 연결 후에 상태 변경
//     socket.on('connect', () => {
//       setConnected(true);
//       console.log('[Client] 소켓 연결됨');
//     });

//     // ✅ 서버로부터 질문 받기
//     socket.on('receiveQuestion', (q) => {
//       console.log('📥 받은 질문:', q);
//     });
//   };

//   const handleSendQuestion = () => {
//     if (code && connected) {
//       const testQuestion = {
//         id: Date.now(),
//         author: '임시 사용자',
//         content: '테스트 질문입니다.',
//         timestamp: new Date().toLocaleTimeString(),
//       };

//       socket.emit('newQuestion', {
//         roomSocketId: code,
//         question: testQuestion,
//       });

//       console.log('📤 질문 전송:', testQuestion);
//     }
//   };

//   return (
//     <div style={{ padding: 24 }}>
//       <h1>🧪 방 생성 & 소켓 테스트</h1>
//       <button onClick={handleCreate}>1️⃣ 방 만들고 입장</button>
//       <br /><br />
//       <button onClick={handleSendQuestion} disabled={!code || !connected}>
//         2️⃣ 질문 전송 (임시 데이터)
//       </button>
//       {code && <p>✅ 현재 방: <strong>{code}</strong></p>}
//     </div>
//   );
// }
