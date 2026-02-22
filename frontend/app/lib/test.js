'use client';
import { useEffect } from 'react';
import { getSocket } from './socket';

export default function TestSocket() {
  useEffect(() => {
    const socket = getSocket();
    
    socket.on('connect', () => {
      console.log('Connected to server!', socket.id);
    });
    socket.emit('create_game');

socket.on('game_created', (roomId) => {
  console.log('Room ID:', roomId);
});


    return () => socket.disconnect();
  }, []);

  return <div>Check console for connection</div>;
}