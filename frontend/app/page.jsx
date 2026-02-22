'use client';
import { useState } from 'react';
import GameContainer from './components/GameContainer';
import LobbyScreen from './components/multiplayer/LobbyScreen';
import MultiplayerMenu from './components/multiplayer/MultiplayerMenu';
import CreateGameScreen from './components/multiplayer/CreateGameScreen';
import JoinGameScreen from './components/multiplayer/JoinGameScreen';
import MultiplayerGame from './components/multiplayer/MultiplayerGame';

export default function Home() {
const [screen, setScreen] = useState('lobby'); // lobby, menu, create, join, bot-game, multiplayer-game
const [roomId, setRoomId] = useState(null);
const [playerColor, setPlayerColor] = useState(null);

// Screen router
const renderScreen = () => {
switch(screen) {
    case 'lobby':
    return <LobbyScreen onSelectMode={(mode) => {
        if (mode === 'friend') setScreen('menu');
        if (mode === 'bot') setScreen('bot-game');
    }} />;
    
    case 'menu':
    return <MultiplayerMenu 
        onCreateGame={() => setScreen('create')}
        onJoinGame={() => setScreen('join')}
        onBack={() => setScreen('lobby')}
    />;
    
    case 'create':
    return <CreateGameScreen 
        onGameReady={(id, color) => {
        setRoomId(id);
        setPlayerColor(color);
        setScreen('multiplayer-game');
        }}
        onBack={() => setScreen('menu')}
    />;
    
    case 'join':
    return <JoinGameScreen 
        onGameReady={(id, color) => {
        setRoomId(id);
        setPlayerColor(color);
        setScreen('multiplayer-game');
        }}
        onBack={() => setScreen('menu')}
    />;
    
    case 'bot-game':
    return <GameContainer onBack={() => setScreen('lobby')} />;
    
    case 'multiplayer-game':
    return <MultiplayerGame 
        roomId={roomId}
        playerColor={playerColor}
        onBack={() => setScreen('lobby')}
    />;
    
    default:
    return <LobbyScreen onSelectMode={(mode) => setScreen(mode === 'friend' ? 'menu' : 'bot-game')} />;
}
};

return (
<div className="flex min-h-screen items-center justify-center bg-zinc-900">
    {renderScreen()}
</div>
);
}