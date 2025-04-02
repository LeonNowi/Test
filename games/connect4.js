document.addEventListener('DOMContentLoaded', () => {
    // DOM-Elemente
    const gameBoard = document.getElementById('gameBoard');
    const columnsContainer = document.getElementById('columnsContainer');
    const gameStatus = document.getElementById('gameStatus');
    const newGameBtn = document.getElementById('newGameBtn');
    const closeGameBtn = document.getElementById('closeGameBtn');
    const closeGame = document.getElementById('closeGame');
    const columnFullMessage = document.getElementById('columnFullMessage');

    // Spielvariablen
    let currentPlayer = 1;
    let gameActive = true;
    let gameState = Array(6).fill().map(() => Array(7).fill(0));

    // Initialisierung
    createGameBoard();

    // Event-Listener
    newGameBtn.addEventListener('click', startNewGame);
    closeGameBtn.addEventListener('click', () => window.close());
    closeGame.addEventListener('click', () => window.close());

    // Spielfeld erstellen
    function createGameBoard() {
        // Spalten-Hitboxen erstellen
        columnsContainer.innerHTML = '';
        for (let col = 0; col < 7; col++) {
            const column = document.createElement('div');
            column.className = 'connect4-column';
            column.dataset.column = col;
            column.addEventListener('click', () => handleColumnClick(col));
            columnsContainer.appendChild(column);
        }

        // Spielzellen erstellen
        gameBoard.querySelectorAll('.connect4-cell').forEach(cell => cell.remove());
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cell = document.createElement('div');
                cell.className = 'connect4-cell';
                cell.dataset.row = row;
                cell.dataset.column = col;
                gameBoard.appendChild(cell);
            }
        }
    }

    // Spaltenklick behandeln
    function handleColumnClick(col) {
        if (!gameActive) return;

        const row = findAvailableRow(col);
        if (row === -1) {
            showColumnFullMessage(col);
            return;
        }

        animateChipDrop(col, row, currentPlayer, () => {
            gameState[row][col] = currentPlayer;
            updateBoard();

            if (checkWin(row, col)) {
                gameActive = false;
                gameStatus.textContent = `Spieler ${currentPlayer} hat gewonnen!`;
                highlightWinningCells(row, col);
                return;
            }

            if (isBoardFull()) {
                gameActive = false;
                gameStatus.textContent = 'Unentschieden!';
                return;
            }

            currentPlayer = currentPlayer === 1 ? 2 : 1;
            gameStatus.textContent = `Spieler ${currentPlayer} ist am Zug`;
        });
    }

    // Chip fallen lassen (verbesserte Version)
    function animateChipDrop(col, row, player, callback) {
        const cell = document.querySelector(`.connect4-cell[data-row="${row}"][data-column="${col}"]`);
        const chip = document.createElement('div');
        chip.className = 'connect4-chip';
        chip.dataset.player = player;

        // Hole die exakten Positionen
        const cellRect = cell.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();

        // Berechne relative Positionen
        const startX = cellRect.left - boardRect.left;
        const startY = -cellRect.height;
        const endY = cellRect.top - boardRect.top;

        // Setze Chip-Eigenschaften
        chip.style.position = 'absolute';
        chip.style.left = `${startX}px`;
        chip.style.top = `${startY}px`;
        chip.style.width = `${cellRect.width}px`;
        chip.style.height = `${cellRect.height}px`;

        gameBoard.appendChild(chip);

        // Starte Animation
        requestAnimationFrame(() => {
            chip.style.transition = 'top 0.3s cubic-bezier(0.4, 0, 0.6, 1)';
            chip.style.top = `${endY}px`;
        });

        // Auf Animation Ende warten
        chip.addEventListener('transitionend', () => {
            cell.dataset.player = player;
            chip.remove();
            callback();
        }, { once: true });
    }

    // Spalte voll Nachricht anzeigen
    function showColumnFullMessage(col) {
        const columnElement = document.querySelector(`.connect4-column[data-column="${col}"]`);
        const rect = columnElement.getBoundingClientRect();
        const boardRect = gameBoard.getBoundingClientRect();

        columnFullMessage.style.left = `${rect.left + rect.width / 2 - boardRect.left}px`;
        columnFullMessage.style.top = `${rect.top - boardRect.top - 15}px`;
        columnFullMessage.style.opacity = '1';

        setTimeout(() => {
            columnFullMessage.style.opacity = '0';
        }, 1000);
    }

    // Verfügbare Reihe finden
    function findAvailableRow(col) {
        for (let row = 5; row >= 0; row--) {
            if (gameState[row][col] === 0) return row;
        }
        return -1;
    }

    // Spielfeld aktualisieren
    function updateBoard() {
        document.querySelectorAll('.connect4-cell').forEach(cell => {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.column);
            const player = gameState[row][col];

            if (player > 0) {
                cell.dataset.player = player;
            } else {
                cell.removeAttribute('data-player');
            }
        });
    }

    // Gewinnprüfung
    function checkWin(row, col) {
        const directions = [
            [0, 1],  // Horizontal
            [1, 0],  // Vertikal
            [1, 1],  // Diagonal rechts
            [1, -1]   // Diagonal links
        ];

        return directions.some(([dx, dy]) => {
            let count = 1;
            count += countInDirection(row, col, dx, dy);
            count += countInDirection(row, col, -dx, -dy);
            return count >= 4;
        });
    }

    // Steine in Richtung zählen
    function countInDirection(row, col, dx, dy) {
        let count = 0;
        let r = row + dx;
        let c = col + dy;

        while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameState[r][c] === currentPlayer) {
            count++;
            r += dx;
            c += dy;
        }

        return count;
    }

    // Gewinnende Steine markieren
    function highlightWinningCells(row, col) {
        const directions = [
            [0, 1], [1, 0], [1, 1], [1, -1]
        ];

        for (const [dx, dy] of directions) {
            const cells = [];

            for (let i = -3; i <= 3; i++) {
                const r = row + dx * i;
                const c = col + dy * i;
                if (r >= 0 && r < 6 && c >= 0 && c < 7 && gameState[r][c] === currentPlayer) {
                    cells.push({ row: r, col: c });
                } else if (cells.length >= 4) {
                    break;
                } else {
                    cells.length = 0;
                }
            }

            if (cells.length >= 4) {
                cells.slice(0, 4).forEach(({ row, col }) => {
                    const cell = document.querySelector(`.connect4-cell[data-row="${row}"][data-column="${col}"]`);
                    cell?.classList.add('highlight');
                });
                break;
            }
        }
    }

    // Brett voll?
    function isBoardFull() {
        return gameState[0].every(cell => cell !== 0);
    }

    // Neues Spiel
    function startNewGame() {
        gameState = Array(6).fill().map(() => Array(7).fill(0));
        currentPlayer = 1;
        gameActive = true;
        gameStatus.textContent = 'Spieler 1 ist am Zug';

        document.querySelectorAll('.connect4-cell').forEach(cell => {
            cell.removeAttribute('data-player');
            cell.classList.remove('highlight');
        });
    }
});