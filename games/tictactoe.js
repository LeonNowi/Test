document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const board = document.getElementById('gameBoard');
    const cells = document.querySelectorAll('.tictactoe-cell');
    const status = document.getElementById('gameStatus');
    const resetButton = document.getElementById('resetGame');
    const closeButton = document.getElementById('closeGameBtn');
    const closeGame = document.getElementById('closeGame');
    const aiThinking = document.getElementById('aiThinking');

    // Spielvariablen
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let currentPlayer = 'X';
    let gameActive = true;
    const playerNames = { 'X': 'Spieler', 'O': 'KI' };
    const playerColors = { 'X': 'var(--player-x)', 'O': 'var(--player-o)' };

    // Gewinnkombinationen
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontal
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // vertikal
        [0, 4, 8], [2, 4, 6]             // diagonal
    ];

    // Initialisierung
    initGame();

    // Event-Listener
    board.addEventListener('click', handleCellClick);
    resetButton.addEventListener('click', resetGame);
    closeButton.addEventListener('click', () => window.close());
    closeGame.addEventListener('click', () => window.close());

    // Spiel initialisieren
    function initGame() {
        gameState = ['', '', '', '', '', '', '', '', ''];
        currentPlayer = 'X';
        gameActive = true;
        status.textContent = `Du bist X, die KI ist O`;
        aiThinking.style.visibility = 'hidden';

        cells.forEach(cell => {
            cell.querySelector('span').textContent = '';
            cell.classList.remove('x', 'o', 'winning-cell');
            cell.style.borderColor = '#444';
        });
    }

    // Zellenklick behandeln
    function handleCellClick(event) {
        const clickedCell = event.target.closest('.tictactoe-cell');
        if (!clickedCell || !gameActive || currentPlayer !== 'X') return;

        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== '') return;

        makeMove(clickedCell, clickedCellIndex, 'X');

        if (gameActive) {
            setTimeout(() => {
                aiThinking.style.visibility = 'visible';
                setTimeout(() => {
                    aiMove();
                    aiThinking.style.visibility = 'hidden';
                }, 800);
            }, 300);
        }
    }

    // Zug durchführen
    function makeMove(cell, index, player) {
        gameState[index] = player;
        cell.querySelector('span').textContent = player;
        cell.classList.add(player.toLowerCase());

        checkResult();
    }

    // Ergebnis prüfen
    function checkResult() {
        let roundWon = false;
        let winningCombo = null;

        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];

            if (gameState[a] === '' || gameState[b] === '' || gameState[c] === '') {
                continue;
            }

            if (gameState[a] === gameState[b] && gameState[b] === gameState[c]) {
                roundWon = true;
                winningCombo = winningConditions[i];
                break;
            }
        }

        if (roundWon) {
            gameActive = false;
            status.textContent = `${playerNames[currentPlayer]} hat gewonnen!`;
            highlightWinningCells(winningCombo);
            return;
        }

        if (!gameState.includes('')) {
            gameActive = false;
            status.textContent = 'Unentschieden!';
            return;
        }

        changePlayer();
    }

    // Gewinnende Zellen markieren
    function highlightWinningCells(combo) {
        combo.forEach(index => {
            cells[index].classList.add('winning-cell');
        });
    }

    // Spieler wechseln
    function changePlayer() {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Aktueller Spieler: ${playerNames[currentPlayer]}`;
    }

    // KI-Zug
    function aiMove() {
        if (!gameActive || currentPlayer !== 'O') return;

        // 1. Gewinnzug finden
        let move = findWinningMove('O');

        // 2. Blockieren wenn Spieler gewinnt
        if (!move) move = findWinningMove('X');

        // 3. Zentrum nehmen
        if (!move && gameState[4] === '') move = 4;

        // 4. Zufällige Ecke
        if (!move) {
            const corners = [0, 2, 6, 8];
            const emptyCorners = corners.filter(i => gameState[i] === '');
            if (emptyCorners.length) {
                move = emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
            }
        }

        // 5. Zufälliger Zug
        if (!move) {
            const emptyCells = [];
            gameState.forEach((cell, index) => {
                if (cell === '') emptyCells.push(index);
            });
            if (emptyCells.length) {
                move = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            }
        }

        if (move !== null) {
            makeMove(cells[move], move, 'O');
        }
    }

    // Gewinnzug finden
    function findWinningMove(player) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            const spots = [gameState[a], gameState[b], gameState[c]];

            if (spots.filter(spot => spot === player).length === 2) {
                const emptySpot = winningConditions[i].find(index => gameState[index] === '');
                if (emptySpot !== undefined) return emptySpot;
            }
        }
        return null;
    }

    // Spiel zurücksetzen
    function resetGame() {
        initGame();
    }
});