// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game State
let gameState = 'start'; // 'start', 'playing', 'gameOver'
let score = 0;
let coins = 0;
let distance = 0;
let gameSpeed = 5;
let frameCount = 0;

// Player
const player = {
    x: canvas.width / 2 - 25,
    y: canvas.height - 150,
    width: 50,
    height: 50,
    lane: 1, // 0 = left, 1 = center, 2 = right
    isJumping: false,
    jumpVelocity: 0,
    jumpPower: -15,
    gravity: 0.8,
    groundY: canvas.height - 150,
    color: '#FF6B6B'
};

// Lane positions
const lanes = [
    canvas.width / 2 - 100,  // Left
    canvas.width / 2 - 25,   // Center
    canvas.width / 2 + 50    // Right
];

// Obstacles and Coins
let obstacles = [];
let coinObjects = [];
let groundSegments = [];

// Initialize ground
function initGround() {
    groundSegments = [];
    for (let i = 0; i < 20; i++) {
        groundSegments.push({
            y: canvas.height - 100,
            width: canvas.width,
            height: 100,
            offset: i * 50
        });
    }
}

// Input Handling
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    
    if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (gameState === 'playing' && !player.isJumping) {
            player.jumpVelocity = player.jumpPower;
            player.isJumping = true;
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Touch/Mobile Support
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe (jump)
        if (deltaY < -30 && !player.isJumping) {
            player.jumpVelocity = player.jumpPower;
            player.isJumping = true;
        }
    } else {
        // Horizontal swipe (move)
        if (deltaX < -50 && player.lane > 0) {
            player.lane--;
        } else if (deltaX > 50 && player.lane < 2) {
            player.lane++;
        }
    }
});

// Handle Player Movement
function handleInput() {
    if (gameState !== 'playing') return;
    
    // Left movement
    if ((keys['ArrowLeft'] || keys['a'] || keys['A']) && player.lane > 0) {
        player.lane--;
        keys['ArrowLeft'] = false;
        keys['a'] = false;
        keys['A'] = false;
    }
    
    // Right movement
    if ((keys['ArrowRight'] || keys['d'] || keys['D']) && player.lane < 2) {
        player.lane++;
        keys['ArrowRight'] = false;
        keys['d'] = false;
        keys['D'] = false;
    }
    
    // Update player x position based on lane
    const targetX = lanes[player.lane];
    player.x += (targetX - player.x) * 0.2;
}

// Update Player Physics
function updatePlayer() {
    // Jumping physics
    if (player.isJumping) {
        player.y += player.jumpVelocity;
        player.jumpVelocity += player.gravity;
        
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.isJumping = false;
            player.jumpVelocity = 0;
        }
    }
}

// Spawn Obstacles
function spawnObstacle() {
    if (Math.random() < 0.02) {
        const lane = Math.floor(Math.random() * 3);
        obstacles.push({
            x: lanes[lane],
            y: -50,
            width: 40,
            height: 50,
            lane: lane,
            type: Math.random() > 0.7 ? 'tall' : 'normal'
        });
    }
}

// Spawn Coins
function spawnCoin() {
    if (Math.random() < 0.03) {
        const lane = Math.floor(Math.random() * 3);
        coinObjects.push({
            x: lanes[lane],
            y: -30,
            width: 30,
            height: 30,
            lane: lane,
            rotation: 0
        });
    }
}

// Update Obstacles and Coins
function updateObjects() {
    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.y += gameSpeed;
        
        if (obstacle.type === 'tall') {
            obstacle.height = 80;
        }
        
        // Remove off-screen obstacles
        if (obstacle.y > canvas.height) {
            obstacles.splice(i, 1);
        }
    }
    
    // Update coins
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        const coin = coinObjects[i];
        coin.y += gameSpeed;
        coin.rotation += 0.1;
        
        // Remove off-screen coins
        if (coin.y > canvas.height) {
            coinObjects.splice(i, 1);
        }
    }
}

// Collision Detection
function checkCollisions() {
    const playerRect = {
        x: player.x,
        y: player.y,
        width: player.width,
        height: player.height
    };
    
    // Check obstacle collisions
    for (let obstacle of obstacles) {
        if (Math.abs(player.x - obstacle.x) < 35 &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            gameOver();
            return;
        }
    }
    
    // Check coin collections
    for (let i = coinObjects.length - 1; i >= 0; i--) {
        const coin = coinObjects[i];
        if (Math.abs(player.x - coin.x) < 30 &&
            player.y < coin.y + coin.height &&
            player.y + player.height > coin.y) {
            coins++;
            coinObjects.splice(i, 1);
            score += 10;
        }
    }
}

// Draw Functions
function drawGround() {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Draw lane markers
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    
    for (let lane of lanes) {
        ctx.beginPath();
        ctx.moveTo(lane + 12.5, canvas.height - 100);
        ctx.lineTo(lane + 12.5, canvas.height);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function drawPlayer() {
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    
    // Draw player body
    ctx.fillStyle = player.color;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);
    
    // Draw player face
    ctx.fillStyle = '#000';
    ctx.fillRect(-15, -15, 8, 8);
    ctx.fillRect(7, -15, 8, 8);
    ctx.fillRect(-5, 0, 10, 5);
    
    ctx.restore();
}

function drawObstacles() {
    for (let obstacle of obstacles) {
        ctx.fillStyle = '#654321';
        ctx.fillRect(obstacle.x - obstacle.width / 2, obstacle.y, obstacle.width, obstacle.height);
        
        // Draw obstacle details
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(obstacle.x - obstacle.width / 2 + 5, obstacle.y, obstacle.width - 10, 10);
    }
}

function drawCoins() {
    for (let coin of coinObjects) {
        ctx.save();
        ctx.translate(coin.x, coin.y + coin.height / 2);
        ctx.rotate(coin.rotation);
        
        // Draw coin
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.width / 2, coin.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw coin symbol
        ctx.fillStyle = '#FFA500';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);
        
        ctx.restore();
    }
}

function drawBackground() {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height - 100);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#98D8C8');
    gradient.addColorStop(1, '#6B8E23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height - 100);
    
    // Draw temple in background
    ctx.fillStyle = '#8B7355';
    const templeX = canvas.width / 2;
    const templeY = 100;
    
    // Temple base
    ctx.fillRect(templeX - 60, templeY + 50, 120, 80);
    
    // Temple columns
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(templeX - 50 + i * 50, templeY + 50, 20, 80);
    }
    
    // Temple top
    ctx.fillRect(templeX - 80, templeY, 160, 60);
    
    // Temple peak
    ctx.beginPath();
    ctx.moveTo(templeX, templeY);
    ctx.lineTo(templeX - 30, templeY - 30);
    ctx.lineTo(templeX + 30, templeY - 30);
    ctx.closePath();
    ctx.fill();
}

// Game Loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameState === 'playing') {
        frameCount++;
        
        // Update game speed (gradually increase)
        gameSpeed = 5 + Math.floor(frameCount / 500);
        
        // Update distance
        distance = Math.floor(frameCount / 10);
        score = distance + coins * 10;
        
        // Handle input
        handleInput();
        
        // Update player
        updatePlayer();
        
        // Spawn objects
        spawnObstacle();
        spawnCoin();
        
        // Update objects
        updateObjects();
        
        // Check collisions
        checkCollisions();
        
        // Draw everything
        drawBackground();
        drawGround();
        drawObstacles();
        drawCoins();
        drawPlayer();
        
        // Update UI
        updateUI();
    }
    
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('coins').textContent = coins;
    document.getElementById('distance').textContent = distance;
}

function startGame() {
    gameState = 'playing';
    score = 0;
    coins = 0;
    distance = 0;
    gameSpeed = 5;
    frameCount = 0;
    obstacles = [];
    coinObjects = [];
    
    player.x = canvas.width / 2 - 25;
    player.y = player.groundY;
    player.lane = 1;
    player.isJumping = false;
    player.jumpVelocity = 0;
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
}

function gameOver() {
    gameState = 'gameOver';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('finalDistance').textContent = distance;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

// Event Listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Initialize
initGround();
gameLoop();
