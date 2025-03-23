document.addEventListener('DOMContentLoaded', () => {
    const GRID_SIZE = 4;
    const CELL_SIZE_VAR = '--cell-size';
    const GRID_GAP_VAR = '--grid-gap';
    const ANIMATION_DURATION = 100; // Accelerated animations (was 250ms)

    let grid = [];
    let score = 0;
    let bestScore = localStorage.getItem('bestScore') || 0;
    let gameOver = false;
    let gameWon = false;
    let canContinue = false;
    let isAnimating = false; // Track if animations are in progress

    // Dark mode and opacity settings
    let isDarkMode = localStorage.getItem('darkMode') === 'true';
    let globalOpacity = parseFloat(localStorage.getItem('globalOpacity') || '1');

    const gridContainer = document.querySelector('.grid-container');
    const tileContainer = document.querySelector('.tile-container');
    const scoreElement = document.getElementById('score');
    const bestScoreElement = document.getElementById('best-score');
    const gameMessage = document.querySelector('.game-message');
    const messageText = gameMessage.querySelector('p');
    const newGameButton = document.getElementById('new-game-button');
    const retryButton = document.getElementById('retry-button');

    // UI controls for dark mode and opacity
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const opacitySlider = document.getElementById('opacity-slider');

    // Function to apply dark mode
    function applyDarkMode(enabled) {
        if (enabled) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.checked = false;
        }
        localStorage.setItem('darkMode', enabled);
    }

    // Function to apply global opacity for dark mode
    function applyGlobalOpacity(value) {
        document.documentElement.style.setProperty('--global-opacity', value);
        opacitySlider.value = value;
        localStorage.setItem('globalOpacity', value);
    }

    // Initialize appearance settings
    function initAppearance() {
        applyDarkMode(isDarkMode);
        applyGlobalOpacity(globalOpacity);

        // Set up event listeners for appearance controls
        darkModeToggle.addEventListener('change', () => {
            isDarkMode = darkModeToggle.checked;
            applyDarkMode(isDarkMode);
        });

        opacitySlider.addEventListener('input', () => {
            globalOpacity = opacitySlider.value;
            applyGlobalOpacity(globalOpacity);
        });
    }

    function setupGameBoard() {
        gridContainer.innerHTML = '';
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                gridContainer.appendChild(cell);
            }
        }
    }

    function initGame() {
        setupGameBoard();
        grid = createEmptyGrid();
        score = 0;
        gameOver = false;
        gameWon = false;
        canContinue = false;
        isAnimating = false;
        updateScore(0);
        clearTiles();
        gameMessage.classList.remove('game-over', 'game-won');
        addRandomTile();
        addRandomTile();
    }

    function createEmptyGrid() {
        return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
    }

    function clearTiles() {
        tileContainer.innerHTML = '';
    }

    function updateScore(addedScore) {
        // Update displayed score
        scoreElement.textContent = score;
        bestScoreElement.textContent = bestScore;

        // Show visual score addition animation if points were earned
        if (addedScore > 0) {
            const scoreAddition = document.createElement('div');
            scoreAddition.className = 'score-addition';
            scoreAddition.textContent = '+' + addedScore;
            scoreAddition.style.top = '5px';

            const scoreBox = document.querySelector('.score-box');
            scoreBox.appendChild(scoreAddition);

            // Remove the element after animation completes (accelerated)
            setTimeout(() => {
                scoreAddition.remove();
            }, 100);
        }
    }

    function getCssVariable(name) {
        return parseInt(getComputedStyle(document.documentElement).getPropertyValue(name));
    }

    function addRandomTile() {
        const emptyCells = [];
        grid.forEach((row, rowIndex) => row.forEach((cell, colIndex) => {
            if (cell === 0) emptyCells.push({ row: rowIndex, col: colIndex });
        }));

        if (emptyCells.length > 0) {
            const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            const value = Math.random() < 0.9 ? 2 : 4;
            grid[row][col] = value;
            addTile(row, col, value);
        }
    }

    function addTile(row, col, value, merged = false) {
        const tile = document.createElement('div');
        tile.className = `tile tile-${value} ${merged ? 'tile-merged' : 'tile-new'}`;
        tile.textContent = value;

        // Calculate position based on CSS variables
        const cellSize = getCssVariable(CELL_SIZE_VAR);
        const gridGap = getCssVariable(GRID_GAP_VAR);
        tile.style.left = `${col * (cellSize + gridGap)}px`;
        tile.style.top = `${row * (cellSize + gridGap)}px`;

        // Add dataset attributes to track tile properties
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;

        // Add subtle entrance delay for new tiles
        if (!merged) {
            tile.style.animationDelay = `${Math.random() * 0.1}s`;
        }

        tileContainer.appendChild(tile);
        return tile;
    }

    function updateTilePosition(tile, row, col) {
        const cellSize = getCssVariable(CELL_SIZE_VAR);
        const gridGap = getCssVariable(GRID_GAP_VAR);
        tile.style.left = `${col * (cellSize + gridGap)}px`;
        tile.style.top = `${row * (cellSize + gridGap)}px`;

        // Update dataset attributes
        tile.dataset.row = row;
        tile.dataset.col = col;
    }

    function renderGrid(newGrid, mergedPositions = []) {
        // Get all existing tiles
        const existingTiles = Array.from(tileContainer.children);
        const existingTilesMap = new Map(); // Map to track positions of existing tiles
        const tilesToRemove = []; // Tiles that should be removed after animation
        const direction = lastMoveDirection; // Use the last move direction

        // First, map existing tiles by their positions
        existingTiles.forEach(tile => {
            const row = parseInt(tile.dataset.row);
            const col = parseInt(tile.dataset.col);
            const value = parseInt(tile.dataset.value);
            const key = `${row},${col}`;

            existingTilesMap.set(key, {
                element: tile,
                row,
                col,
                value
            });
        });

        // Track which tiles have been matched to new positions
        const usedTiles = new Set();
        const newTilePositions = []; // Store positions for tiles in the new grid

        // First, identify new tile positions
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const value = newGrid[row][col];
                if (value !== 0) {
                    newTilePositions.push({ row, col, value });
                }
            }
        }

        // Sort tile positions based on direction of movement
        // This ensures we prioritize matching tiles in the correct order
        if (direction === 'left') {
            newTilePositions.sort((a, b) => a.col - b.col); // Process left-most tiles first
        } else if (direction === 'right') {
            newTilePositions.sort((a, b) => b.col - a.col); // Process right-most tiles first
        } else if (direction === 'up') {
            newTilePositions.sort((a, b) => a.row - b.row); // Process top-most tiles first
        } else if (direction === 'down') {
            newTilePositions.sort((a, b) => b.row - a.row); // Process bottom-most tiles first
        }

        // Process each new tile position
        for (const { row, col, value } of newTilePositions) {
            const key = `${row},${col}`;
            const isMerged = mergedPositions.some(pos => pos.row === row && pos.col === col);

            // If this is a merged tile, create a new tile
            if (isMerged) {
                // Create new merged tile with animation
                addTile(row, col, value, true);

                // Mark existing tiles at this position for removal
                // (they'll be cleaned up after animation)
                if (existingTilesMap.has(key)) {
                    tilesToRemove.push(existingTilesMap.get(key).element);
                    existingTilesMap.delete(key);
                }
                continue;
            }

            // Try to find the best matching tile based on direction and value
            let bestMatchTile = null;
            let bestMatchKey = null;
            let bestMatchDistance = Infinity;

            // Search for matching value tiles that haven't been used yet
            for (const [mapKey, tileInfo] of existingTilesMap.entries()) {
                if (tileInfo.value === value && !usedTiles.has(mapKey)) {
                    // Calculate distance based on movement direction
                    let distance;
                    if (direction === 'left') {
                        // For left movement, tiles should only move leftward
                        if (tileInfo.col < col) continue; // Skip tiles that would move right
                        distance = tileInfo.row === row ? tileInfo.col - col : 1000; // Prioritize same row
                    } else if (direction === 'right') {
                        // For right movement, tiles should only move rightward
                        if (tileInfo.col > col) continue; // Skip tiles that would move left
                        distance = tileInfo.row === row ? col - tileInfo.col : 1000; // Prioritize same row
                    } else if (direction === 'up') {
                        // For upward movement, tiles should only move upward
                        if (tileInfo.row < row) continue; // Skip tiles that would move down
                        distance = tileInfo.col === col ? tileInfo.row - row : 1000; // Prioritize same column
                    } else if (direction === 'down') {
                        // For downward movement, tiles should only move downward
                        if (tileInfo.row > row) continue; // Skip tiles that would move up
                        distance = tileInfo.col === col ? row - tileInfo.row : 1000; // Prioritize same column
                    } else {
                        // If direction is unknown, use Manhattan distance
                        distance = Math.abs(tileInfo.row - row) + Math.abs(tileInfo.col - col);
                    }

                    if (distance < bestMatchDistance) {
                        bestMatchDistance = distance;
                        bestMatchTile = tileInfo.element;
                        bestMatchKey = mapKey;
                    }
                }
            }

            // If found a matching tile, update its position and mark as used
            if (bestMatchTile) {
                updateTilePosition(bestMatchTile, row, col);
                usedTiles.add(bestMatchKey);
                existingTilesMap.delete(bestMatchKey);
            } else {
                // Otherwise create a new tile
                addTile(row, col, value, false);
            }
        }

        // Remove tiles that are no longer needed after animations finish
        setTimeout(() => {
            // Remove any tiles that still exist in the map (they're not in the new grid)
            for (const [_, tileInfo] of existingTilesMap) {
                tileInfo.element.remove();
            }

            // Remove any tiles specifically marked for removal
            tilesToRemove.forEach(tile => tile.remove());
        }, ANIMATION_DURATION);
    }

    function hasWon() {
        // Check if any tile has reached 2048
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 2048) {
                    return true;
                }
            }
        }
        return false;
    }

    // Add variable to track the last move direction
    let lastMoveDirection = null;

    function moveTiles(direction) {
        // Don't allow moves during animations or if game is over
        if (isAnimating || (gameOver && !canContinue)) return false;

        // Store the direction for use in rendering
        lastMoveDirection = direction;

        let newGrid, mergedPositions = [];
        let moved = false, scoreAdd = 0;

        switch (direction) {
            case 'up':
                const resultUp = moveUp();
                newGrid = resultUp.grid;
                mergedPositions = resultUp.mergedPositions;
                moved = resultUp.moved;
                scoreAdd = resultUp.scoreAdd;
                break;
            case 'right':
                const resultRight = moveRight();
                newGrid = resultRight.grid;
                mergedPositions = resultRight.mergedPositions;
                moved = resultRight.moved;
                scoreAdd = resultRight.scoreAdd;
                break;
            case 'down':
                const resultDown = moveDown();
                newGrid = resultDown.grid;
                mergedPositions = resultDown.mergedPositions;
                moved = resultDown.moved;
                scoreAdd = resultDown.scoreAdd;
                break;
            case 'left':
                const resultLeft = moveLeft();
                newGrid = resultLeft.grid;
                mergedPositions = resultLeft.mergedPositions;
                moved = resultLeft.moved;
                scoreAdd = resultLeft.scoreAdd;
                break;
            default: return false;
        }

        if (moved) {
            isAnimating = true;
            grid = newGrid;
            score += scoreAdd;
            if (score > bestScore) {
                bestScore = score;
                localStorage.setItem('bestScore', bestScore);
            }

            // Update score with animation
            updateScore(scoreAdd);

            // Render grid with merged positions for animation
            renderGrid(grid, mergedPositions);

            // Add new tile immediately instead of waiting for animations
            addRandomTile();

            // Check for win condition (tile with 2048)
            if (!gameWon && hasWon()) {
                gameWon = true;
                setTimeout(() => {
                    showGameMessage('You win!', 'game-won');
                }, ANIMATION_DURATION);
            }
            // Check for game over after new tile is added
            else if (!canMove()) {
                gameOver = true;
                setTimeout(() => {
                    showGameMessage('Game over!', 'game-over');
                }, ANIMATION_DURATION);
            }

            // Reset animation state after animations finish
            setTimeout(() => {
                isAnimating = false;
            }, ANIMATION_DURATION);

            return true;
        }
        return false;
    }

    function moveUp() {
        return processTiles('up', col => Array.from({ length: GRID_SIZE }, (_, row) => ({ row, col })));
    }

    function moveRight() {
        return processTiles('right', row => Array.from({ length: GRID_SIZE }, (_, col) => ({ row, col: GRID_SIZE - 1 - col })));
    }

    function moveDown() {
        return processTiles('down', col => Array.from({ length: GRID_SIZE }, (_, row) => ({ row: GRID_SIZE - 1 - row, col })));
    }

    function moveLeft() {
        return processTiles('left', row => Array.from({ length: GRID_SIZE }, (_, col) => ({ row, col })));
    }

    function processTiles(direction, cellsProvider) {
        const newGrid = createEmptyGrid();
        let moved = false, scoreAdd = 0;
        const mergedPositions = [];

        for (let i = 0; i < GRID_SIZE; i++) {
            const cells = cellsProvider(i);
            const line = cells.map(cell => grid[cell.row][cell.col]);
            const result = mergeLine(line);

            scoreAdd += result.scoreAdd;
            if (result.moved) moved = true;

            // Add merged positions to track animations
            if (result.mergedIndices && result.mergedIndices.length > 0) {
                result.mergedIndices.forEach(mergedIndex => {
                    const cell = cells[mergedIndex];
                    mergedPositions.push({ row: cell.row, col: cell.col });
                });
            }

            cells.forEach((cell, index) => {
                newGrid[cell.row][cell.col] = result.line[index];
            });
        }

        return {
            grid: newGrid,
            moved,
            scoreAdd,
            mergedPositions
        };
    }

    function mergeLine(line) {
        const nonZeros = line.filter(v => v !== 0);
        const mergedLine = [];
        const mergedIndices = [];
        let scoreAdd = 0;
        let moved = nonZeros.length !== line.length; // If we filter zeros, that's a move

        for (let i = 0; i < nonZeros.length; i++) {
            if (i + 1 < nonZeros.length && nonZeros[i] === nonZeros[i + 1]) {
                const mergedValue = nonZeros[i] * 2;
                mergedLine.push(mergedValue);
                mergedIndices.push(mergedLine.length - 1); // Track which indices contain merged tiles
                scoreAdd += mergedValue;
                i++; // Skip the next tile since we merged it
                moved = true;
            } else {
                mergedLine.push(nonZeros[i]);
            }
        }

        // Fill the rest with zeros
        while (mergedLine.length < GRID_SIZE) mergedLine.push(0);

        return {
            line: mergedLine,
            moved,
            scoreAdd,
            mergedIndices
        };
    }

    function canMove() {
        // Check for empty cells
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === 0) return true;
            }
        }

        // Check for possible merges horizontally
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE - 1; col++) {
                if (grid[row][col] === grid[row][col + 1]) return true;
            }
        }

        // Check for possible merges vertically
        for (let row = 0; row < GRID_SIZE - 1; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                if (grid[row][col] === grid[row + 1][col]) return true;
            }
        }

        return false;
    }

    function showGameMessage(message, className) {
        // Add a small delay for better UX - allows animations to complete
        setTimeout(() => {
            messageText.textContent = message;
            gameMessage.classList.add(className);

            // Add fade-in effect
            gameMessage.style.opacity = 0;
            gameMessage.style.display = 'flex';

            // Force reflow
            void gameMessage.offsetWidth;

            // Fade in (accelerated)
            gameMessage.style.transition = 'opacity 0.1s ease-in-out';
            gameMessage.style.opacity = 1;
        }, ANIMATION_DURATION);
    }

    // Event listeners
    newGameButton.addEventListener('click', initGame);
    retryButton.addEventListener('click', initGame);

    // Listen for both keydown events and button clicks
    document.addEventListener('keydown', event => {
        // Support for arrow keys and WASD keys
        const keyMap = {
            'ArrowUp': 'up',
            'ArrowRight': 'right',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'w': 'up',
            'd': 'right',
            's': 'down',
            'a': 'left',
            'W': 'up',
            'D': 'right',
            'S': 'down',
            'A': 'left'
        };

        if (keyMap[event.key]) {
            event.preventDefault();
            moveTiles(keyMap[event.key]);
        }
    });

    // Add touch controls for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', event => {
        if (isAnimating) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    });

    document.addEventListener('touchend', event => {
        if (isAnimating || !touchStartX || !touchStartY) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;

        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;

        // Determine the direction of the swipe
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 20) {
                moveTiles('right');
            } else if (deltaX < -20) {
                moveTiles('left');
            }
        } else {
            // Vertical swipe
            if (deltaY > 20) {
                moveTiles('down');
            } else if (deltaY < -20) {
                moveTiles('up');
            }
        }

        touchStartX = 0;
        touchStartY = 0;
    });

    // Initialize the game
    initAppearance();
    initGame();
});
