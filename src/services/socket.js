import io from 'socket.io-client';
import config from '../config/config';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(config.socket.url, config.socket.options);
  }
  return socket;
};

export const getSocket = () => socket;