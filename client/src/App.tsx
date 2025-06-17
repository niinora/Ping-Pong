import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, ServerToClientEvents, ClientToServerEvents } from './types';

const ENDPOINT = 'http://localhost:4000';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;

function App() {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [name, setName] = useState('');
  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [gameOver, setGameOver] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const s = io(ENDPOINT);
    setSocket(s);
    s.on('connect', () => {
      setPlayerId(s.id);
    });
    s.on('gameState', (state) => {
      setGameState(state);
      setWaiting(false);
    });
    s.on('waiting', () => {
      setWaiting(true);
    });
    s.on('gameOver', (winner) => {
      setGameOver(winner);
    });
    s.on('error', (msg) => {
      alert(msg);
      setJoined(false);
      setWaiting(false);
    });
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !gameState) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // Draw paddles
    Object.values(gameState.players).forEach((player, idx) => {
      ctx.fillStyle = idx === 0 ? 'white' : 'white';
      const x = idx === 0 ? 0 : GAME_WIDTH - PADDLE_WIDTH;
      ctx.fillRect(x, player.paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
    });
    // Draw ball
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_SIZE, 0, 2 * Math.PI);
    ctx.fill();
    // Draw net
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2, 0);
    ctx.lineTo(GAME_WIDTH / 2, GAME_HEIGHT);
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.setLineDash([]);
    // Draw scores
    ctx.font = '32px Arial';
    ctx.fillStyle = 'white';
    const players = Object.values(gameState.players);
    if (players[0]) ctx.fillText(players[0].score.toString(), GAME_WIDTH / 2 - 50, 40);
    if (players[1]) ctx.fillText(players[1].score.toString(), GAME_WIDTH / 2 + 30, 40);
  }, [gameState]);

  // Handle paddle movement
  useEffect(() => {
    if (!socket || !joined || !gameState || !playerId) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const y = e.clientY - rect.top - PADDLE_HEIGHT / 2;
      socket.emit('movePaddle', y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [socket, joined, gameState, playerId]);

  const handleJoin = () => {
    if (socket && name.trim()) {
      socket.emit('join', name.trim());
      setJoined(true);
      setGameOver(null);
    }
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit('leave');
      setJoined(false);
      setGameState(null);
      setWaiting(false);
      setGameOver(null);
    }
  };

  return (
    <div style={{ background: '#222', minHeight: '100vh', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h1>Ping Pong</h1>
      {!joined ? (
        <div style={{ background: 'white', color: '#222', padding: 32, borderRadius: 8, minWidth: 320 }}>
          <h2>Multiplayer game</h2>
          <div style={{ marginBottom: 16 }}>
            <label>Your name:</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ marginLeft: 8 }} />
          </div>
          <button onClick={handleJoin} style={{ width: '100%', padding: 12, background: '#007bff', color: 'white', border: 'none', borderRadius: 4, fontWeight: 'bold', fontSize: 16 }}>Join Game</button>
          <div style={{ marginTop: 24, background: '#f5f5f5', borderRadius: 8, padding: 16 }}>
            <b>How to Play</b>
            <ul>
              <li>Move your mouse to control your paddle</li>
              <li>Hit the ball to score points</li>
              <li>First to 5 points wins</li>
              <li>You'll be matched with another player</li>
            </ul>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {waiting && <div style={{ color: 'orange', marginBottom: 16 }}>Waiting for another player...</div>}
          <canvas ref={canvasRef} width={GAME_WIDTH} height={GAME_HEIGHT} style={{ background: 'black', borderRadius: 8, marginBottom: 16 }} />
          <div>
            <button onClick={handleLeave} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 'bold' }}>Leave</button>
          </div>
          {gameOver && <div style={{ color: 'gold', marginTop: 16, fontSize: 24 }}>Game Over! Winner: {gameOver}</div>}
        </div>
      )}
    </div>
  );
}

export default App;
