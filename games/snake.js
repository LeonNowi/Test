document.addEventListener('DOMContentLoaded', () => {
    // Konfiguration
    const config = {
        gridSize: 20,
        colors: {
            snake: '#8A2BE2',
            snakeHead: '#A855F7',
            food: '#FF4D4D',
            background: '#111111',
            text: '#e0e0e0'
        },
        speed: 150 // Konstante Geschwindigkeit (ms)
    };

    // DOM-Elemente
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const highscoreElement = document.getElementById('highscore');
    const restartBtn = document.getElementById('restart-btn');
    const pauseIndicator = document.getElementById('pauseIndicator');

    // Spielzustand
    let snake = [];
    let food = {};
    let dx = 0;
    let dy = 0;
    let score = 0;
    let highscore = 0;
    let gameLoopId = null;
    let lastUpdate = 0;
    let isGameOver = false;
    let isPaused = false;
    let blinkInterval = null;

    // Initialisierung
    function initGame() {
        isGameOver = false;
        isPaused = false;
        snake = [
            { x: 200, y: 200 },
            { x: 180, y: 200 },
            { x: 160, y: 200 }
        ];
        dx = config.gridSize;
        dy = 0;
        score = 0;

        // Highscore laden
        highscore = localStorage.getItem('snakeHighscore') || 0;
        highscoreElement.textContent = highscore;
        scoreElement.textContent = score;

        placeFood();
        drawGame();
        restartBtn.style.display = 'none';
        pauseIndicator.style.display = 'none';

        // Event-Listener
        document.removeEventListener('keydown', handleRestartKey);
        document.addEventListener('keydown', changeDirection);
        document.addEventListener('keydown', handlePauseKey);
        if (gameLoopId) cancelAnimationFrame(gameLoopId);
        if (blinkInterval) clearInterval(blinkInterval);
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Spiel-Loop (konstante Geschwindigkeit)
    function gameLoop(timestamp) {
        if (isGameOver || isPaused) return;

        if (timestamp - lastUpdate > config.speed) {
            lastUpdate = timestamp;
            updateGame();
        }
        gameLoopId = requestAnimationFrame(gameLoop);
    }

    // Spiel aktualisieren
    function updateGame() {
        const head = {
            x: snake[0].x + dx,
            y: snake[0].y + dy
        };

        if (checkCollision(head)) {
            gameOver();
            return;
        }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            handleFoodCollision();
        } else {
            snake.pop();
        }

        drawGame();
    }

    // Kollision prüfen
    function checkCollision(head) {
        // Wandkollision
        if (head.x < 0 || head.x >= canvas.width ||
            head.y < 0 || head.y >= canvas.height) {
            return true;
        }

        // Selbstkollision
        return snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    // Essen behandeln (ohne Geschwindigkeitserhöhung)
    function handleFoodCollision() {
        score += 10;
        scoreElement.textContent = score;

        // Highscore aktualisieren
        if (score > highscore) {
            highscore = score;
            highscoreElement.textContent = highscore;
            localStorage.setItem('snakeHighscore', highscore);
        }

        placeFood();
    }

    // Pause-Funktion
    function handlePauseKey(e) {
        if (e.key === 'p' || e.key === 'P') {
            togglePause();
        }
    }

    function togglePause() {
        isPaused = !isPaused;
        pauseIndicator.style.display = isPaused ? 'block' : 'none';

        if (!isPaused) {
            lastUpdate = performance.now();
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    }

    // Essen platzieren
    function placeFood() {
        const gridCells = canvas.width / config.gridSize;

        do {
            food = {
                x: Math.floor(Math.random() * gridCells) * config.gridSize,
                y: Math.floor(Math.random() * gridCells) * config.gridSize
            };
        } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    }

    // Spiel zeichnen
    function drawGame() {
        // Hintergrund
        ctx.fillStyle = config.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Schlange
        snake.forEach((segment, index) => {
            ctx.fillStyle = index === 0 ? config.colors.snakeHead : config.colors.snake;
            ctx.globalAlpha = index === 0 ? 0.9 : 0.6;
            ctx.fillRect(segment.x, segment.y, config.gridSize, config.gridSize);

            // Augen für den Kopf
            if (index === 0) {
                ctx.fillStyle = 'white';
                ctx.globalAlpha = 1;
                const eyeSize = config.gridSize / 5;
                const offset = config.gridSize / 4;

                // Linkes Auge
                ctx.beginPath();
                ctx.arc(
                    segment.x + offset,
                    segment.y + offset,
                    eyeSize, 0, Math.PI * 2
                );
                ctx.fill();

                // Rechtes Auge
                ctx.beginPath();
                ctx.arc(
                    segment.x + config.gridSize - offset,
                    segment.y + offset,
                    eyeSize, 0, Math.PI * 2
                );
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;

        // Essen
        ctx.fillStyle = config.colors.food;
        ctx.beginPath();
        ctx.arc(
            food.x + config.gridSize / 2,
            food.y + config.gridSize / 2,
            config.gridSize / 2 - 2,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    // Spielende
    function gameOver() {
        isGameOver = true;
        cancelAnimationFrame(gameLoopId);

        // Blink-Effekt
        let blinkCount = 0;
        blinkInterval = setInterval(() => {
            if (blinkCount % 2 === 0) {
                ctx.fillStyle = '#FF4D4D';
                snake.forEach(segment => {
                    ctx.fillRect(segment.x, segment.y, config.gridSize, config.gridSize);
                });
            } else {
                drawGame();
            }

            blinkCount++;
            if (blinkCount >= 6) {
                clearInterval(blinkInterval);
                showRestart();
            }
        }, 200);
    }

    // Neustart anzeigen
    function showRestart() {
        restartBtn.style.display = 'block';
        document.removeEventListener('keydown', changeDirection);
        document.addEventListener('keydown', handleRestartKey);
    }

    // Tastatursteuerung
    function changeDirection(e) {
        if (isGameOver || isPaused) return;

        const key = e.key;
        const goingUp = dy === -config.gridSize;
        const goingDown = dy === config.gridSize;
        const goingLeft = dx === -config.gridSize;
        const goingRight = dx === config.gridSize;

        if (key === 'ArrowUp' && !goingDown) {
            dx = 0;
            dy = -config.gridSize;
        } else if (key === 'ArrowDown' && !goingUp) {
            dx = 0;
            dy = config.gridSize;
        } else if (key === 'ArrowLeft' && !goingRight) {
            dx = -config.gridSize;
            dy = 0;
        } else if (key === 'ArrowRight' && !goingLeft) {
            dx = config.gridSize;
            dy = 0;
        }
    }

    // Neustart per Tastatur
    function handleRestartKey(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            initGame();
        }
    }

    // Initialisierung
    restartBtn.addEventListener('click', initGame);
    initGame();
});