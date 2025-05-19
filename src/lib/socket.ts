import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  path: '/api/socket_io', // 서버랑 반드시 일치해야 함
  transports: ['websocket'],
});

export default socket;
