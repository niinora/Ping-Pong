import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Player, Ball, GameState, ServerToClientEvents, ClientToServerEvents, PlayerId } from './types';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.get('/', (req, res) => {
    res.send('Pong server is running!');
});

const PORT = process.env.PORT || 4000;

interface Room {
    id: string;
    players: PlayerId[];
    state: GameState;
    interval?: NodeJS.Timeout;
}

const ROOMS: Record<string, Room> = {};
const PADDLE_HEIGHT = 80;
const GAME_HEIGHT = 400;
const GAME_WIDTH = 600;
const PADDLE_WIDTH = 10;
const BALL_SIZE = 10;
const WIN_SCORE = 5;

function createInitialState(): GameState {
    return {
        players: {},
        ball: {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT / 2,
            vx: Math.random() > 0.5 ? 4 : -4,
            vy: (Math.random() - 0.5) * 6,
        },
        isPlaying: false,
    };
}

function createRoom(roomId: string): Room {
    return {
        id: roomId,
        players: [],
        state: createInitialState(),
    };
}

function getOpponent(room: Room, playerId: PlayerId): PlayerId | undefined {
    return room.players.find((id) => id !== playerId);
}

io.on('connection', (socket) => {
    let currentRoom: Room | null = null;
    let playerId: PlayerId = socket.id;

    socket.on('join', (name: string) => {
        // Find or create a room with 1 player
        let room = Object.values(ROOMS).find((r) => r.players.length === 1);
        if (!room) {
            room = createRoom(socket.id);
            ROOMS[room.id] = room;
        }
        if (room.players.length >= 2) {
            socket.emit('error', 'Room is full');
            return;
        }
        room.players.push(playerId);
        room.state.players[playerId] = {
            id: playerId,
            name,
            paddleY: GAME_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            score: 0,
        };
        currentRoom = room;
        socket.join(room.id);
        if (room.players.length === 2) {
            room.state.isPlaying = true;
            startGameLoop(room);
        } else {
            socket.emit('waiting');
        }
        io.to(room.id).emit('gameState', room.state);
    });

    socket.on('movePaddle', (y: number) => {
        if (!currentRoom) return;
        const player = currentRoom.state.players[playerId];
        if (player) {
            player.paddleY = Math.max(0, Math.min(GAME_HEIGHT - PADDLE_HEIGHT, y));
        }
    });

    socket.on('leave', () => {
        leaveRoom();
    });

    socket.on('disconnect', () => {
        leaveRoom();
    });

    function leaveRoom() {
        if (!currentRoom) return;
        // Remove player
        delete currentRoom.state.players[playerId];
        currentRoom.players = currentRoom.players.filter((id) => id !== playerId);
        if (currentRoom.players.length === 0) {
            // Clean up room
            if (currentRoom.interval) clearInterval(currentRoom.interval);
            delete ROOMS[currentRoom.id];
        } else {
            // Notify opponent
            io.to(currentRoom.id).emit('waiting');
            currentRoom.state.isPlaying = false;
            if (currentRoom.interval) clearInterval(currentRoom.interval);
        }
        currentRoom = null;
    }
});

function startGameLoop(room: Room) {
    if (room.interval) clearInterval(room.interval);
    room.interval = setInterval(() => {
        const state = room.state;
        if (!state.isPlaying) return;
        // Move ball
        state.ball.x += state.ball.vx;
        state.ball.y += state.ball.vy;
        // Collide with top/bottom
        if (state.ball.y <= 0 || state.ball.y + BALL_SIZE >= GAME_HEIGHT) {
            state.ball.vy *= -1;
        }
        // Collide with paddles
        const [leftId, rightId] = room.players;
        const left = state.players[leftId];
        const right = state.players[rightId];
        // Left paddle
        if (
            state.ball.x <= PADDLE_WIDTH &&
            left &&
            state.ball.y + BALL_SIZE >= left.paddleY &&
            state.ball.y <= left.paddleY + PADDLE_HEIGHT
        ) {
            state.ball.vx *= -1;
            state.ball.x = PADDLE_WIDTH;
        }
        // Right paddle
        if (
            state.ball.x + BALL_SIZE >= GAME_WIDTH - PADDLE_WIDTH &&
            right &&
            state.ball.y + BALL_SIZE >= right.paddleY &&
            state.ball.y <= right.paddleY + PADDLE_HEIGHT
        ) {
            state.ball.vx *= -1;
            state.ball.x = GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE;
        }
        // Score left
        if (state.ball.x < 0) {
            if (right) right.score++;
            resetBall(state, -1);
        }
        // Score right
        if (state.ball.x > GAME_WIDTH) {
            if (left) left.score++;
            resetBall(state, 1);
        }
        // Check win
        if (left && left.score >= WIN_SCORE) {
            state.isPlaying = false;
            state.winner = left.id;
            io.to(room.id).emit('gameOver', left.name);
            if (room.interval) clearInterval(room.interval);
        } else if (right && right.score >= WIN_SCORE) {
            state.isPlaying = false;
            state.winner = right.id;
            io.to(room.id).emit('gameOver', right.name);
            if (room.interval) clearInterval(room.interval);
        }
        io.to(room.id).emit('gameState', state);
    }, 1000 / 60);
}

function resetBall(state: GameState, direction: number) {
    state.ball.x = GAME_WIDTH / 2;
    state.ball.y = GAME_HEIGHT / 2;
    state.ball.vx = direction * 4;
    state.ball.vy = (Math.random() - 0.5) * 6;
}

server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
}); 