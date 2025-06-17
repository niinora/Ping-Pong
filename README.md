# Multiplayer Pong Game
#Nino Ramishviili
## Overview
This project is a real-time, multiplayer Pong game built with a full-stack architecture. Two players can join a game session, control paddles, and compete to score points by bouncing a ball past their opponent. The game state is synchronized in real-time between both players using WebSockets.

## Features
- **Real-Time Multiplayer:** Two players are matched and play against each other in real time.
- **Game Mechanics:** Classic Pong gameplay with paddle movement, ball physics, collision detection, and scoring.
- **Responsive UI:** Built with React and TypeScript for a modern, interactive frontend.
- **Type Safety:** TypeScript is used on both the client and server for robust, maintainable code.
- **Room Management:** Players are paired automatically into game sessions.

---

## Technologies Used
- **Frontend:** React, TypeScript, Socket.IO Client
- **Backend:** Node.js, Express, TypeScript, Socket.IO
- **Communication:** WebSockets (via Socket.IO)

---

## Architecture
- **Client (React):**
  - Renders the game UI (join screen, game canvas, scores).
  - Captures player input (mouse movement for paddle control).
  - Communicates with the server using Socket.IO events.
  - Updates the UI in real time based on game state from the server.

- **Server (Node.js + Express):**
  - Manages game rooms and pairs players.
  - Maintains the authoritative game state (paddles, ball, scores).
  - Runs the game loop (ball movement, collision, scoring, win detection).
  - Broadcasts game state updates to both players in a room.

---

## How It Works
1. **Player joins:**
   - The player enters their name and clicks "Join Game."
   - The server pairs them with another waiting player or creates a new room.
2. **Game starts:**
   - When two players are present, the game loop starts on the server.
   - The server updates the ball and paddle positions, checks for collisions, and manages scoring.
   - The server emits the updated game state to both clients ~60 times per second.
3. **Player input:**
   - Each client sends paddle movement events to the server based on mouse movement.
   - The server updates the corresponding paddle position in the game state.
4. **Game over:**
   - The first player to reach 5 points wins.
   - The server notifies both clients of the winner and stops the game loop.

---

## Project Structure
```
pingpong/
├── client/      # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main React component
│   │   ├── types.ts        # Shared game types
│   │   └── ...
│   └── ...
├── server/      # Node.js + TypeScript backend
│   ├── src/
│   │   ├── index.ts        # Main server logic
│   │   ├── types.ts        # Shared game types
│   │   └── ...
│   └── ...
└── README.md    # Project documentation
```

---

## Setup & Running the Project

### 1. **Install dependencies**
- **Backend:**
  ```sh
  cd server
  npm install
  ```
- **Frontend:**
  ```sh
  cd client
  npm install
  ```

### 2. **Start the backend server**
```sh
cd server
npx ts-node src/index.ts
```
- The server will run on [http://localhost:4000](http://localhost:4000)

### 3. **Start the frontend client**
```sh
cd client
npm start
```
- The React app will run on [http://localhost:3000](http://localhost:3000)

### 4. **Play the game**
- Open [http://localhost:3000](http://localhost:3000) in two browser windows or tabs.
- Enter a name and click **Join Game** in both windows.
- Play against each other in real time!

---

## Code Highlights
- **TypeScript Types:** Shared between client and server for game state, player, ball, and events.
- **Socket.IO Events:**
  - `join`: Player joins a game
  - `movePaddle`: Player moves their paddle
  - `gameState`: Server sends updated game state
  - `gameOver`: Server notifies clients of the winner
  - `waiting`: Waiting for another player
  - `error`: Error handling
- **Game Loop:** Runs on the server at 60 FPS, updates ball and paddle positions, checks for collisions and scoring.

---

## Customization & Extensions
- Add keyboard or touch controls for mobile support
- Improve UI/UX with animations or sound effects
- Add player matchmaking, leaderboards, or chat
- Deploy to cloud platforms (e.g., Vercel, Heroku, Render)

---

## License
This project is for educational purposes. 