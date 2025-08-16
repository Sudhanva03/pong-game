const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menuScreen');
const scoreboard = document.getElementById('scoreboard');
const player1ScoreElem = document.getElementById('player1Score');
const player2ScoreElem = document.getElementById('player2Score');
const lobbyDiv = document.getElementById('lobby');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

const paddleWidth = 10, paddleHeight = 100, ballSize = 10;
let leftPaddleY, rightPaddleY, ballX, ballY, ballSpeedX, ballSpeedY;
let player1Score = 0, player2Score = 0;
let scoreLimit = 10;
let keysPressed = {};

let mode = '';
let socket = null;
let roomId = null;
let playerRole = null;

function startGame() {
  menuScreen.style.display = 'none';
  canvas.style.display = 'block';
  scoreboard.style.display = (mode === 'offline' || mode === 'online') ? 'block' : 'none';
  resetGame();
  requestAnimationFrame(updateGame);
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 4 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 3 * (Math.random() > 0.5 ? 1 : -1);
}

function resetGame() {
  leftPaddleY = canvas.height / 2 - paddleHeight / 2;
  rightPaddleY = canvas.height / 2 - paddleHeight / 2;
  resetBall();
  player1Score = 0;
  player2Score = 0;
  updateScoreDisplay();
}

function updateScoreDisplay() {
  player1ScoreElem.textContent = player1Score;
  player2ScoreElem.textContent = player2Score;
}

function drawEverything() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'blue';
  ctx.fillRect(0, leftPaddleY, paddleWidth, paddleHeight);

  ctx.fillStyle = 'red';
  ctx.fillRect(canvas.width - paddleWidth, rightPaddleY, paddleWidth, paddleHeight);

  ctx.fillStyle = 'black';
  ctx.fillRect(ballX, ballY, ballSize, ballSize);
}

function movePaddles() {
  if (mode === 'offline') {
    if (keysPressed['w'] && leftPaddleY > 0) leftPaddleY -= 5;
    if (keysPressed['s'] && leftPaddleY + paddleHeight < canvas.height) leftPaddleY += 5;
    if (keysPressed['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= 5;
    if (keysPressed['ArrowDown'] && rightPaddleY + paddleHeight < canvas.height) rightPaddleY += 5;
  } else if (mode === 'online') {
    if (playerRole === 'player1') {
      if (keysPressed['w'] && leftPaddleY > 0) leftPaddleY -= 5;
      if (keysPressed['s'] && leftPaddleY + paddleHeight < canvas.height) leftPaddleY += 5;
      socket.send(JSON.stringify({ type: 'paddleMove', y: leftPaddleY }));
    } else if (playerRole === 'player2') {
      if (keysPressed['ArrowUp'] && rightPaddleY > 0) rightPaddleY -= 5;
      if (keysPressed['ArrowDown'] && rightPaddleY + paddleHeight < canvas.height) rightPaddleY += 5;
      socket.send(JSON.stringify({ type: 'paddleMove', y: rightPaddleY }));
    }
  }
}

function updateGame() {
  movePaddles();

  if (mode === 'online' && playerRole !== 'player1') {
    drawEverything();
    requestAnimationFrame(updateGame);
    return;
  }

  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballY <= 0 || ballY + ballSize >= canvas.height) {
    ballSpeedY *= -1;
  }

  if (ballX <= paddleWidth) {
    if (ballY >= leftPaddleY && ballY <= leftPaddleY + paddleHeight) {
      ballSpeedX *= -1;
    } else {
      player2Score++;
      updateScoreDisplay();
      if (player2Score >= scoreLimit) return endGame('Player 2');
      resetBall();
    }
  }

  if (ballX + ballSize >= canvas.width - paddleWidth) {
    if (ballY >= rightPaddleY && ballY <= rightPaddleY + paddleHeight) {
      ballSpeedX *= -1;
    } else {
      player1Score++;
      updateScoreDisplay();
      if (player1Score >= scoreLimit) return endGame('Player 1');
      resetBall();
    }
  }

  drawEverything();

  if (mode === 'online' && playerRole === 'player1') {
    socket.send(JSON.stringify({
      type: 'ballUpdate',
      ballX, ballY,
      player1Score, player2Score
    }));
  }

  requestAnimationFrame(updateGame);
}

function endGame(winner) {
  alert(`${winner} wins!`);
  canvas.style.display = 'none';
  scoreboard.style.display = 'none';
  menuScreen.style.display = 'block';
}

document.addEventListener('keydown', e => keysPressed[e.key] = true);
document.addEventListener('keyup', e => keysPressed[e.key] = false);

document.getElementById('offlineMultiplayerBtn').onclick = () => {
  scoreLimit = parseInt(document.getElementById('scoreLimit').value);
  mode = 'offline';
  startGame();
};

document.getElementById('createRoomBtn').onclick = () => {
  socket = new WebSocket('ws://localhost:3000');

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'create' }));
  };

  socket.onmessage = msg => {
    const data = JSON.parse(msg.data);

    if (data.type === 'roomCreated') {
      roomId = data.roomId;
      lobbyDiv.style.display = 'block';
      lobbyDiv.innerHTML = `<p>Room ID: <strong>${roomId}</strong> - Waiting for player 2...</p>`;
    } else if (data.type === 'startGame') {
      mode = 'online';
      playerRole = data.playerRole;
      scoreLimit = parseInt(document.getElementById('scoreLimit').value);
      lobbyDiv.style.display = 'none';
      startGame();
    }
  };

  socket.onerror = err => {
    console.error('WebSocket error:', err);
    alert('Could not connect to server.');
  };
};

document.getElementById('joinRoomBtn').onclick = () => {
  const room = prompt('Enter Room ID:');
  socket = new WebSocket('ws://localhost:3000');
  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'join', roomId: room }));
  };
  socket.onmessage = msg => {
    const data = JSON.parse(msg.data);
    if (data.type === 'startGame') {
      mode = 'online';
      playerRole = data.playerRole;
      scoreLimit = parseInt(document.getElementById('scoreLimit').value);
      lobbyDiv.style.display = 'none'; // ✅ This line
      startGame();
    } else if (data.type === 'error') {
      alert(data.message);
    } else if (data.type === 'paddleMove') {
      if (playerRole === 'player1') rightPaddleY = data.y;
      else leftPaddleY = data.y;
    } else if (data.type === 'ballUpdate') {
      ballX = data.ballX;
      ballY = data.ballY;
      player1Score = data.player1Score;
      player2Score = data.player2Score;
      updateScoreDisplay();
    }
  };
};

    