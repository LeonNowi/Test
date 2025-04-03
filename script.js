document.addEventListener('DOMContentLoaded', function() {
    // ===== MUSIK PLAYER =====
    const audioPlayer = document.getElementById('audio-player');
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValue = document.getElementById('volume-value');

    audioPlayer.volume = 0.01;
    volumeValue.textContent = "1%";

    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        audioPlayer.volume = volume;
        volumeValue.textContent = `${e.target.value}%`;
    });

    playBtn.addEventListener('click', () => {
        audioPlayer.play();
        playBtn.disabled = true;
        pauseBtn.disabled = false;
    });

    pauseBtn.addEventListener('click', () => {
        audioPlayer.pause();
        pauseBtn.disabled = true;
        playBtn.disabled = false;
    });

    // ===== TIC TAC TOE =====
    class TicTacToe {
        constructor() {
            this.board = Array(9).fill('');
            this.currentPlayer = 'X';
            this.gameActive = true;
            this.againstAI = false;
            this.aiTimeout = null;
            this.aiThinking = false; // Neu: Verhindert Doppelzüge
            this.scorePlayer = 0;
            this.scoreAI = 0;
            this.scoreX = 0;
            this.scoreO = 0;
        }

        init(againstAI) {
            this.againstAI = againstAI;
            const gameContainer = document.getElementById('game-container');
            gameContainer.innerHTML = `
                <div class="tictactoe-game">
                    <h3>⭕ TicTacToe</h3>
                    <div class="snake-scores">
                        ${againstAI ? `
                            <div class="snake-score">Dein Score: <span id="score-player">${this.scorePlayer}</span></div>
                            <div class="snake-score">KI Score: <span id="score-ai">${this.scoreAI}</span></div>
                        ` : `
                            <div class="snake-score">Spieler X: <span id="score-x">${this.scoreX}</span></div>
                            <div class="snake-score">Spieler O: <span id="score-o">${this.scoreO}</span></div>
                        `}
                    </div>
                    <div class="game-mode">
                        <button id="vs-ai" class="${againstAI ? 'active' : ''}">🤖 Gegen KI</button>
                        <button id="vs-player" class="${!againstAI ? 'active' : ''}">👥 2 Spieler</button>
                    </div>
                    <div id="ttt-board"></div>
                    <button id="reset-ttt">🔄 Neustart</button>
                    <div class="game-over-popup" id="ttt-popup">
                        <div class="popup-content">
                            <h3 id="popup-title">Spiel beendet</h3>
                            <p id="popup-message"></p>
                            <button id="ttt-play-again">Nochmal spielen</button>
                        </div>
                    </div>
                </div>
            `;

            this.reset();
            this.renderBoard();
            
            document.getElementById('vs-ai').addEventListener('click', () => this.switchMode(true));
            document.getElementById('vs-player').addEventListener('click', () => this.switchMode(false));
            document.getElementById('reset-ttt').addEventListener('click', () => this.reset());
            document.getElementById('ttt-play-again').addEventListener('click', () => this.reset());
        }

        showPopup(message) {
            document.getElementById('popup-message').textContent = message;
            document.getElementById('ttt-popup').style.display = 'flex';
        }

        hidePopup() {
            document.getElementById('ttt-popup').style.display = 'none';
        }

        switchMode(againstAI) {
            clearTimeout(this.aiTimeout);
            this.aiThinking = false; // Zurücksetzen beim Moduswechsel
            this.init(againstAI);
        }

        reset() {
            this.board = Array(9).fill('');
            this.currentPlayer = 'X';
            this.gameActive = true;
            this.aiThinking = false; // Zurücksetzen beim Neustart
            this.hidePopup();
            this.renderBoard();
        }

        renderBoard() {
            const boardElement = document.getElementById('ttt-board');
            boardElement.innerHTML = '';
            
            this.board.forEach((cell, index) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'cell';
                cellElement.dataset.index = index;
                cellElement.textContent = cell;
                if (cell) cellElement.classList.add(cell.toLowerCase());
                cellElement.addEventListener('click', () => this.handleMove(index));
                boardElement.appendChild(cellElement);
            });
        }

        handleMove(index) {
            // Blockiere Klicks während die KI "denkt" oder bei inaktivem Spiel
            if (!this.gameActive || this.board[index] !== '' || this.aiThinking) return;
            
            this.makeMove(index, this.currentPlayer);
            
            if (this.againstAI && this.gameActive && this.currentPlayer === 'O') {
                this.aiThinking = true; // Flag setzen
                this.aiTimeout = setTimeout(() => {
                    this.makeAIMove();
                    this.aiThinking = false; // Flag zurücksetzen
                }, 300); // 300ms Verzögerung für KI-Zug
            }
        }

        makeMove(index, player) {
            this.board[index] = player;
            this.renderBoard();
            
            if (this.checkWin(player)) {
                this.endGame(player === 'X' 
                    ? (this.againstAI ? 'Du hast gewonnen! 🎉' : 'Spieler X gewinnt!') 
                    : (this.againstAI ? 'Die KI hat gewonnen! 🤖' : 'Spieler O gewinnt!'));
                return;
            }
            
            if (this.board.every(cell => cell !== '')) {
                this.endGame('Unentschieden! 🤝');
                return;
            }
            
            this.currentPlayer = player === 'X' ? 'O' : 'X';
        }

        makeAIMove() {
            if (!this.gameActive) return;

            // 1. Prüfe auf Gewinnmöglichkeit
            for (let i = 0; i < 9; i++) {
                if (this.board[i] === '') {
                    const testBoard = [...this.board];
                    testBoard[i] = 'O';
                    if (this.checkWin('O', testBoard)) {
                        this.makeMove(i, 'O');
                        return;
                    }
                }
            }
            
            // 2. Blockiere Spieler
            for (let i = 0; i < 9; i++) {
                if (this.board[i] === '') {
                    const testBoard = [...this.board];
                    testBoard[i] = 'X';
                    if (this.checkWin('X', testBoard)) {
                        this.makeMove(i, 'O');
                        return;
                    }
                }
            }
            
            // 3. Zentrum oder zufälliges Feld
            const emptyCells = this.board
                .map((cell, index) => cell === '' ? index : null)
                .filter(val => val !== null);
                
            if (emptyCells.includes(4)) {
                this.makeMove(4, 'O');
            } else {
                const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                this.makeMove(randomIndex, 'O');
            }
        }

        checkWin(player, board = this.board) {
            const winPatterns = [
                [0, 1, 2], [3, 4, 5], [6, 7, 8],
                [0, 3, 6], [1, 4, 7], [2, 5, 8],
                [0, 4, 8], [2, 4, 6]
            ];
            return winPatterns.some(pattern => pattern.every(index => board[index] === player));
        }

        endGame(message) {
            this.gameActive = false;
            
            // Score aktualisieren
            if (this.againstAI) {
                if (message.includes('Du hast')) {
                    this.scorePlayer++;
                    document.getElementById('score-player').textContent = this.scorePlayer;
                } else if (message.includes('Die KI hat')) {
                    this.scoreAI++;
                    document.getElementById('score-ai').textContent = this.scoreAI;
                }
            } else {
                if (message.includes('Spieler X')) {
                    this.scoreX++;
                    document.getElementById('score-x').textContent = this.scoreX;
                } else if (message.includes('Spieler O')) {
                    this.scoreO++;
                    document.getElementById('score-o').textContent = this.scoreO;
                }
            }

            this.showPopup(message);
        }
    }

    // ===== SNAKE SPIEL =====
    class SnakeGame {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.cellSize = 20;
            this.snake = [
                {x: 5, y: 10},
                {x: 4, y: 10},
                {x: 3, y: 10}
            ];
            this.food = {};
            this.direction = 'right';
            this.nextDirection = 'right';
            this.gameSpeed = 150;
            this.score = 0;
            this.highScore = localStorage.getItem('snakeHighScore') || 0;
            this.gameLoop = null;
            this.isPaused = false;
            this.lastUpdateTime = 0;
            this.pauseTime = 0;
        }

        init() {
            const gameContainer = document.getElementById('game-container');
            gameContainer.innerHTML = `
                <div class="snake-game">
                    <h3>🐍 Snake</h3>
                    <div class="snake-scores">
                        <div class="snake-score">Punkte: <span id="snake-score">0</span></div>
                        <div class="snake-highscore">Highscore: <span id="snake-highscore">${this.highScore}</span></div>
                    </div>
                    <canvas id="snake-canvas" width="400" height="400"></canvas>
                    <div class="snake-controls">
                        <button id="snake-start">Start</button>
                        <button id="snake-pause" disabled>Pause</button>
                        <button id="snake-reset">Neustart</button>
                    </div>
                    <div class="game-over-popup" id="game-over-popup">
                        <div class="popup-content">
                            <h3>Game Over!</h3>
                            <p>Dein Score: <span id="final-score">0</span></p>
                            <p>Highscore: <span id="final-highscore">${this.highScore}</span></p>
                            <button id="play-again">Nochmal spielen</button>
                        </div>
                    </div>
                    <p>Steuerung: Pfeiltasten oder WASD</p>
                </div>
            `;

            this.canvas = document.getElementById('snake-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.placeFood();
            this.draw();
            
            document.getElementById('snake-start').addEventListener('click', () => this.startGame());
            document.getElementById('snake-pause').addEventListener('click', () => this.togglePause());
            document.getElementById('snake-reset').addEventListener('click', () => this.resetGame());
            document.getElementById('play-again').addEventListener('click', () => this.resetGame());
            
            document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        }

        showGameOver() {
            document.getElementById('final-score').textContent = this.score;
            document.getElementById('final-highscore').textContent = this.highScore;
            document.getElementById('game-over-popup').style.display = 'flex';
        }

        hideGameOver() {
            document.getElementById('game-over-popup').style.display = 'none';
        }

        updateHighScore() {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                document.getElementById('snake-highscore').textContent = this.highScore;
            }
        }

        startGame() {
            if (this.gameLoop) {
                clearInterval(this.gameLoop);
            }
            this.lastUpdateTime = Date.now();
            this.gameLoop = setInterval(() => this.gameUpdate(), this.gameSpeed);
            this.isPaused = false;
            document.getElementById('snake-pause').disabled = false;
            document.getElementById('snake-pause').textContent = 'Pause';
        }

        gameUpdate() {
            this.lastUpdateTime = Date.now();
            this.update();
        }

        togglePause() {
            if (!this.gameLoop && !this.isPaused) return;
            
            if (this.isPaused) {
                const elapsed = Date.now() - this.pauseTime;
                this.lastUpdateTime += elapsed;
                this.gameLoop = setInterval(() => this.gameUpdate(), this.gameSpeed);
                this.isPaused = false;
                document.getElementById('snake-pause').textContent = 'Pause';
            } else {
                this.pauseTime = Date.now();
                clearInterval(this.gameLoop);
                this.gameLoop = null;
                this.isPaused = true;
                document.getElementById('snake-pause').textContent = 'Weiter';
            }
        }

        resetGame() {
            this.hideGameOver();
            clearInterval(this.gameLoop);
            this.gameLoop = null;
            this.isPaused = false;
            this.snake = [
                {x: 5, y: 10},
                {x: 4, y: 10},
                {x: 3, y: 10}
            ];
            this.direction = 'right';
            this.nextDirection = 'right';
            this.score = 0;
            this.gameSpeed = 150;
            this.updateScore();
            this.placeFood();
            this.draw();
            document.getElementById('snake-pause').textContent = 'Pause';
            document.getElementById('snake-pause').disabled = true;
        }

        placeFood() {
            const maxPos = this.canvas.width / this.cellSize;
            let foodPlaced = false;
            
            while (!foodPlaced) {
                this.food = {
                    x: Math.floor(Math.random() * maxPos),
                    y: Math.floor(Math.random() * maxPos)
                };
                
                foodPlaced = !this.snake.some(segment => 
                    segment.x === this.food.x && segment.y === this.food.y
                );
            }
        }

        update() {
            this.direction = this.nextDirection;
            const head = {...this.snake[0]};
            
            switch (this.direction) {
                case 'up': head.y--; break;
                case 'down': head.y++; break;
                case 'left': head.x--; break;
                case 'right': head.x++; break;
            }
            
            if (
                head.x < 0 || head.x >= this.canvas.width / this.cellSize ||
                head.y < 0 || head.y >= this.canvas.height / this.cellSize ||
                this.snake.some(segment => segment.x === head.x && segment.y === head.y)
            ) {
                this.gameOver();
                return;
            }
            
            this.snake.unshift(head);
            
            if (head.x === this.food.x && head.y === this.food.y) {
                this.score++;
                this.updateScore();
                this.placeFood();
                
                if (this.score % 5 === 0 && this.gameSpeed > 50) {
                    this.gameSpeed -= 5;
                    clearInterval(this.gameLoop);
                    this.gameLoop = setInterval(() => this.gameUpdate(), this.gameSpeed);
                }
            } else {
                this.snake.pop();
            }
            
            this.draw();
        }

        draw() {
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#4ac7c7';
            this.snake.forEach((segment, index) => {
                if (index === 0) {
                    this.ctx.fillStyle = getComputedStyle(document.documentElement)
                        .getPropertyValue('--accent-purple').trim();
                }
                this.ctx.fillRect(
                    segment.x * this.cellSize,
                    segment.y * this.cellSize,
                    this.cellSize - 1,
                    this.cellSize - 1
                );
                if (index === 0) this.ctx.fillStyle = '#4ac7c7';
            });
            
            this.ctx.fillStyle = '#ff4757';
            this.ctx.fillRect(
                this.food.x * this.cellSize,
                this.food.y * this.cellSize,
                this.cellSize - 1,
                this.cellSize - 1
            );
        }

        updateScore() {
            document.getElementById('snake-score').textContent = this.score;
        }

        gameOver() {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
            this.updateHighScore();
            this.showGameOver();
        }

        handleKeyPress(e) {
            if (!this.gameLoop && e.key !== ' ') return;
            const key = e.key.toLowerCase();
            
            if ((key === 'arrowup' || key === 'w') && this.direction !== 'down') {
                this.nextDirection = 'up';
            } else if ((key === 'arrowdown' || key === 's') && this.direction !== 'up') {
                this.nextDirection = 'down';
            } else if ((key === 'arrowleft' || key === 'a') && this.direction !== 'right') {
                this.nextDirection = 'left';
            } else if ((key === 'arrowright' || key === 'd') && this.direction !== 'left') {
                this.nextDirection = 'right';
            } else if (key === ' ') {
                this.togglePause();
            }
        }
    }

    // ===== SPIEL AUSWAHL =====
    document.getElementById('tictactoe-btn').addEventListener('click', () => {
        new TicTacToe().init(false);
    });

    document.getElementById('connect4-btn').addEventListener('click', () => {
        document.getElementById('game-container').innerHTML = `
            <div class="game-placeholder">
                <p>4 Gewinnt - Coming Soon</p>
                <div class="grid-pattern"></div>
            </div>
        `;
    });

    document.getElementById('snake-btn').addEventListener('click', () => {
        new SnakeGame().init();
    });
});