import { Server as IOServer } from 'socket.io';

declare global {
  var io: IOServer | undefined;
}

export const getIO = (): IOServer | null => {
  return globalThis.io ?? null;
};

export const setIO = (io: IOServer) => {
  globalThis.io = io;
};