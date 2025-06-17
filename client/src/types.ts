export type PlayerId = string;

export interface Player {
    id: PlayerId;
    name: string;
    paddleY: number;
    score: number;
}

export interface Ball {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

export interface GameState {
    players: Record<PlayerId, Player>;
    ball: Ball;
    isPlaying: boolean;
    winner?: PlayerId;
}

export interface ServerToClientEvents {
    gameState: (state: GameState) => void;
    gameOver: (winner: string) => void;
    waiting: () => void;
    error: (message: string) => void;
}

export interface ClientToServerEvents {
    join: (name: string) => void;
    movePaddle: (y: number) => void;
    leave: () => void;
} 