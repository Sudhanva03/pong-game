const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Base.html')); // Your HTML file
});

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    // Create Room
    if (data.type === 'create') {
      const roomCode = generateRoomCode();
      rooms[roomCode] = { players: [ws] };
      ws.roomCode = roomCode;
      ws.playerRole = 0;

      ws.send(JSON.stringify({
        type: 'roomCreated',
        roomId: roomCode,
        playerRole: 0
      }));

    // Join Room
    } else if (data.type === 'join') {
      const room = rooms[data.roomId];
      if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
      }

      if (room.players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
        return;
      }

      room.players.push(ws);
      ws.roomCode = data.roomId;
      ws.playerRole = 1;

      // Notify both players to start game
      room.players.forEach((player, index) => {
        player.send(JSON.stringify({
          type: 'startGame',
          playerRole: index
        }));
      });

    // Game State Sync
    } else if (data.type === 'game') {
      const room = rooms[ws.roomCode];
      if (!room) return;

      const state = data.state;

      // Paddle movement
      if (state.paddleY !== undefined) {
        room.players.forEach(player => {
          if (player !== ws && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify({
              type: 'paddleMove',
              y: state.paddleY
            }));
          }
        });
      }

      // Ball and score update
      if (state.ballX !== undefined && state.ballY !== undefined) {
        room.players.forEach(player => {
          if (player !== ws && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify({
              type: 'ballUpdate',
              ballX: state.ballX,
              ballY: state.ballY,
              player1Score: state.player1Score,
              player2Score: state.player2Score
            }));
          }
        });
      }
    }
  });

  ws.on('close', () => {
    const roomCode = ws.roomCode;
    if (!roomCode || !rooms[roomCode]) return;

    rooms[roomCode].players = rooms[roomCode].players.filter(p => p !== ws);

    if (rooms[roomCode].players.length === 0) {
      delete rooms[roomCode];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});