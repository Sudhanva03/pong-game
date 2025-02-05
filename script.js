console.log("Game is starting...");

let topPosition1 = 50; // Position of paddle 1
let topPosition2 = 50; // Position of paddle 2
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const paddleHeight = 70; // Assuming height of the paddles
const paddleWidth = 20;
let moveUp1 = false, moveDown1 = false;
let moveUp2 = false, moveDown2 = false;
let gamePaused = false;
let score1 = 0;
let score2 = 0;
// Drawing the ball position in court
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballRadius = 10;
let ballSpeedX = 5;
let ballSpeedY = 5;

console.log("Canvas dimensions:", canvas.width, canvas.height);

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
drawRectangles();

function drawRectangles() {
    console.log("Drawing paddles and ball...");
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.fillStyle = '#0000FF';
    ctx.fillRect(50, topPosition1, paddleWidth, paddleHeight); // Draw LHS paddle
    ctx.fillStyle = '#Ff0000';
    ctx.fillRect(canvas.width - 100, topPosition2, paddleWidth, paddleHeight); // Draw RHS paddle
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height); // The line in the middle
    ctx.strokeStyle = '#000000'; // Line color
    ctx.lineWidth = 2; // Line width
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2); // The actual ball drawing in court
    ctx.fillStyle = '#000000'; // Ball color
    ctx.fill();
    ctx.closePath();
}

function updateScore(player) {                 //
    console.log("Updating score for", player); //
    if (player === 'player1') {                //
        score1++;                              //
    } else if (player === 'player2') {         //                     actually does the job of updating
        score2++;                              //
    }                                          //
    displayScore();                            //
}

function displayScore() {
    //document.getElementById('scoreboard').innerHTML = `Player 1: ${score1} | Player 2: ${score2}`;
    document.querySelector('#scoreboard .player1_color').innerHTML = `Player 1: ${score1} `; 
    document.querySelector('#scoreboard .player2_color').innerHTML = `Player 2: ${score2} `; 
    console.log("Scoreboard updated:", score1, score2);
}

function checkScore() {
    if (ballX - ballRadius < 0) {                      //
        updateScore('player2');                        //
        resetBall();                                   //
    } else if (ballX + ballRadius > canvas.width) {    //        Score changes depending on which side of the wall the ball come in contact with 
        updateScore('player1');                        //
        resetBall();                                   //
    }                                                  //
}

function resetBall() {                                       //
    ballX = canvas.width / 2;                                //          the game breaks if this does'nt exist.  
    ballY = canvas.height / 2;                               // 
    ballSpeedX = -ballSpeedX; // Change ball direction       //
    console.log("Ball reset to center:", ballX, ballY);      //
}

function updatePosition() {
    if (!gamePaused) { // Only update position if the game is not paused
        if (moveDown1 && topPosition1 + paddleHeight < canvas.height) {
            topPosition1 += 10;
        }
        if (moveUp1 && topPosition1 > 0) {
            topPosition1 -= 10;
        }
        if (moveDown2 && topPosition2 + paddleHeight < canvas.height) {
            topPosition2 += 10;
        }
        if (moveUp2 && topPosition2 > 0) {
            topPosition2 -= 10;
        }

        // Update ball position
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Ball collision with top and bottom walls
        if (ballY + ballRadius > canvas.height || ballY - ballRadius < 0) {
            ballSpeedY = -ballSpeedY;
        }

        // Ball collision with paddles
        if (ballX - ballRadius < 70 
            && ballY > topPosition1 
            && ballY < topPosition1 + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }
        if (ballX + ballRadius > canvas.width - 100 
            && ballY > topPosition2 
            && ballY < topPosition2 + paddleHeight) {
            ballSpeedX = -ballSpeedX;
        }

        // Check for scoring
        checkScore();

        drawRectangles();
    }
    requestAnimationFrame(updatePosition); // Animation frame
}

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        gamePaused = !gamePaused; // Toggle game pause state
    }
    if (!gamePaused) {
        if (event.key === 'ArrowDown') {
            moveDown2 = true; // RHS paddle down
        }
        if (event.key === 'ArrowUp') {
            moveUp2 = true; // RHS paddle up
        }
        if (event.key === 's') {
            moveDown1 = true; // LHS paddle down
        }
        if (event.key === 'w') {
            moveUp1 = true; // LHS paddle up
        }
    }
});

document.addEventListener('keyup', function (event) {
    if (!gamePaused) {
        if (event.key === 'ArrowDown') {
            moveDown2 = false; // Stop moving RHS paddle down
        }
        if (event.key === 'ArrowUp') {
            moveUp2 = false; // Stop moving RHS paddle up
        }
        if (event.key === 's') {
            moveDown1 = false; // Stop moving LHS paddle down
        }
        if (event.key === 'w') {
            moveUp1 = false; // Stop moving LHS paddle up
        }
    }
});

window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight; // This is important if the screen is minimized or you want to play on the phone
    drawRectangles(); // Resizes the canvas to fit on most devices
});

requestAnimationFrame(updatePosition); // Start the update loop