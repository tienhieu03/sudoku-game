// script.js

document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('sudoku-board');
    const numpadNumbers = document.querySelector('.numpad-numbers');
    const messageArea = document.getElementById('message-area');
    const newGameBtn = document.getElementById('new-game-btn');
    const difficultySelect = document.getElementById('difficulty-select');
    const validateBtn = document.getElementById('validate-btn');
    const hintBtn = document.getElementById('hint-btn');
    const resetBtn = document.getElementById('reset-btn');
    const eraseBtn = document.getElementById('erase-btn');
    const hintsLeftSpan = document.getElementById('hints-left');

    let currentBoard = []; // The board the user interacts with
    let solutionBoard = []; // The hidden complete solution
    let initialBoard = []; // The initial state of the puzzle for reset
    let selectedCell = null; // { row, col, element }
    let hintsRemaining = 3;

    // --- Initialization ---

    function initGame() {
        const difficulty = difficultySelect.value;
        const { puzzle, solution } = generateSudoku(difficulty);

        currentBoard = JSON.parse(JSON.stringify(puzzle)); // Deep copy
        solutionBoard = solution;
        initialBoard = JSON.parse(JSON.stringify(puzzle)); // Deep copy for reset
        hintsRemaining = 3; // Reset hints

        renderBoard();
        updateHintButton();
        clearSelection();
        clearMessage();
        clearErrorHighlights();
    }

    function renderBoard() {
        boardElement.innerHTML = ''; // Clear previous board
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;

                const value = currentBoard[r][c];
                if (value !== 0) {
                    cell.textContent = value;
                    // Check if this cell was part of the initial puzzle
                    if (initialBoard[r][c] !== 0) {
                        cell.classList.add('prefilled');
                    } else {
                         cell.classList.add('user-filled'); // Maybe style user numbers differently
                    }
                } else {
                    cell.addEventListener('click', handleCellClick);
                }

                 // Add thicker grid lines visually separating 3x3 boxes
                if ((c + 1) % 3 === 0 && c < N - 1) {
                    cell.style.borderRightWidth = '2px';
                    cell.style.borderRightColor = 'var(--grid-border)';
                }
                if ((r + 1) % 3 === 0 && r < N - 1) {
                     cell.style.borderBottomWidth = '2px';
                     cell.style.borderBottomColor = 'var(--grid-border)';
                }


                boardElement.appendChild(cell);
            }
        }
    }

    function createNumpad() {
        numpadNumbers.innerHTML = ''; // Clear previous
        for (let i = 1; i <= 9; i++) {
            const btn = document.createElement('button');
            btn.classList.add('numpad-btn');
            btn.textContent = i;
            btn.addEventListener('click', () => handleNumberInput(i));
            numpadNumbers.appendChild(btn);
        }
    }

    // --- Event Handlers ---

    function handleCellClick(event) {
        const cellElement = event.target;
        const row = parseInt(cellElement.dataset.row);
        const col = parseInt(cellElement.dataset.col);

        // Don't allow selecting prefilled cells
        if (initialBoard[row][col] !== 0) {
            clearSelection();
            return;
        }

        selectCell(row, col, cellElement);
    }

    function handleNumberInput(num) {
        if (!selectedCell) return; // No cell selected

        const { row, col, element } = selectedCell;

        // Clear previous error state on the cell if any
        element.classList.remove('error', 'hinted');

        // Check if the number is valid *according to Sudoku rules* (optional immediate feedback)
        // Note: This checks against the current board state, not the final solution
        // if (!isValid(currentBoard, row, col, num)) {
        //     // Optional: Provide immediate feedback for invalid moves
        //     // element.classList.add('error');
        //     // showMessage("Invalid move for this spot.", "error");
        //     // return;
        // }

        currentBoard[row][col] = num;
        element.textContent = num;
        element.classList.add('user-filled'); // Mark as user input

        // Check if board is complete and correct
        if (isBoardComplete() && isBoardCorrect()) {
            showMessage("Congratulations! You solved it!", "success");
            // Optionally disable further input or highlight success
            clearSelection(); // Deselect after winning
        } else {
             clearMessage(); // Clear any previous message
        }
    }

     function handleErase() {
        if (!selectedCell) return;

        const { row, col, element } = selectedCell;

        // Only allow erasing user-entered numbers
        if (initialBoard[row][col] === 0) {
            currentBoard[row][col] = 0;
            element.textContent = '';
            element.classList.remove('error', 'hinted', 'user-filled');
            clearMessage();
        }
    }

    function handleNewGame() {
        initGame();
    }

    function handleValidate() {
        clearErrorHighlights(); // Clear previous errors
        let errorsFound = 0;
        let boardComplete = true;

        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                const cellValue = currentBoard[r][c];
                const cellElement = boardElement.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);

                if (cellValue === 0) {
                    boardComplete = false;
                    continue; // Skip empty cells for validation against solution
                }

                // Check against the hidden solution
                if (cellValue !== solutionBoard[r][c]) {
                    // Only mark errors on user-filled cells
                    if (initialBoard[r][c] === 0) {
                         cellElement.classList.add('error');
                         errorsFound++;
                    }
                }
            }
        }

        if (errorsFound > 0) {
            showMessage(`Found ${errorsFound} error(s). Keep trying!`, "error");
        } else if (!boardComplete) {
             showMessage("No errors found so far, but the board isn't complete.", "info");
        } else {
            showMessage("Congratulations! You solved it correctly!", "success");
             clearSelection();
        }
    }

    function handleHint() {
        if (hintsRemaining <= 0 || !selectedCell) return;

        const { row, col, element } = selectedCell;

        // Only provide hints for empty, user-editable cells
        if (currentBoard[row][col] === 0 && initialBoard[row][col] === 0) {
            const correctValue = solutionBoard[row][col];
            currentBoard[row][col] = correctValue;
            element.textContent = correctValue;
            element.classList.add('hinted'); // Style the hinted cell
            element.classList.remove('user-filled', 'error'); // Remove other states

            hintsRemaining--;
            updateHintButton();
            clearMessage();

             // Check for win after hint
            if (isBoardComplete() && isBoardCorrect()) {
                showMessage("Congratulations! You solved it!", "success");
                clearSelection();
            }

        } else if (initialBoard[row][col] !== 0) {
             showMessage("Cannot get a hint for a pre-filled cell.", "info");
        } else if (currentBoard[row][col] !== 0) {
             showMessage("Hint only works on empty cells. Erase first if needed.", "info");
        }
         // Deselect after giving hint? Optional.
         // clearSelection();
    }


    function handleReset() {
        // Restore the board to its initial state for this puzzle
        currentBoard = JSON.parse(JSON.stringify(initialBoard));
        renderBoard(); // Re-render with initial numbers
        clearSelection();
        clearMessage();
        clearErrorHighlights();
        // Keep hints remaining as they were, or reset them? Let's keep them.
        // hintsRemaining = 3;
        // updateHintButton();
    }


    // --- Helper Functions ---

    function selectCell(row, col, element) {
        clearSelection(); // Clear previous selection first

        selectedCell = { row, col, element };
        element.classList.add('selected');

        // Highlight row, column, and box (optional but helpful)
        highlightRelatedCells(row, col, true);
    }

    function clearSelection() {
        if (selectedCell) {
            selectedCell.element.classList.remove('selected');
            highlightRelatedCells(selectedCell.row, selectedCell.col, false); // Remove highlights
            selectedCell = null;
        }
    }

    function highlightRelatedCells(row, col, addHighlight) {
        const action = addHighlight ? 'add' : 'remove';

        // 1. Clear previous highlights IF adding new ones
        if (addHighlight) {
            // Find all currently highlighted cells
            const highlightedCells = boardElement.querySelectorAll('.cell.highlighted');
            highlightedCells.forEach(cell => {
                cell.classList.remove('highlighted');
            });
        }

        // 2. Apply/Remove highlight to Row and Column (excluding the cell itself)
        for (let i = 0; i < N; i++) {
            // Row cells
            if (i !== col) { // Don't highlight the selected cell itself in its row
                const rowCell = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${i}']`);
                if (rowCell) rowCell.classList[action]('highlighted');
            }
            // Column cells
            if (i !== row) { // Don't highlight the selected cell itself in its column
                const colCell = boardElement.querySelector(`.cell[data-row='${i}'][data-col='${col}']`);
                if (colCell) colCell.classList[action]('highlighted');
            }
        }

        // 3. Apply/Remove highlight to 3x3 Box (excluding the cell itself)
        const startRow = row - (row % 3);
        const startCol = col - (col % 3);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const rBox = startRow + i;
                const cBox = startCol + j;
                // Don't highlight the selected cell itself
                if (rBox !== row || cBox !== col) {
                    const boxCell = boardElement.querySelector(`.cell[data-row='${rBox}'][data-col='${cBox}']`);
                    if (boxCell) boxCell.classList[action]('highlighted');
                }
            }
        }

        // 4. Ensure the selected cell itself NEVER has the 'highlighted' class
        // (it should only have 'selected') - This is mostly handled above, but belt-and-suspenders
        const selectedElement = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
        if (selectedElement) {
            selectedElement.classList.remove('highlighted');
        }

        // --- REMOVED THE CODE THAT INTERFERED WITH 'selected' ---
        // The following lines were the cause of the bug and have been removed:
        // if (!addHighlight && selectedCell && selectedCell.row === row && selectedCell.col === col) {
        //      selectedCell.element.classList.add('selected'); // Problematic line
        // }
        // if (addHighlight && selectedCell && selectedCell.element) {
        //     selectedCell.element.classList.remove('highlighted');
        //     selectedCell.element.classList.add('selected'); // Redundant/Potentially problematic
        // }
        // --- END REMOVED CODE ---
    }


    function clearErrorHighlights() {
        boardElement.querySelectorAll('.cell.error').forEach(cell => {
            cell.classList.remove('error');
        });
    }

    function showMessage(msg, type = "info") { // type can be 'info', 'success', 'error'
        messageArea.textContent = msg;
        messageArea.className = `message-area message-${type}`; // Use classes for styling later if needed
        // Simple color coding for now
        switch(type) {
            case 'success': messageArea.style.color = '#28a745'; break;
            case 'error': messageArea.style.color = '#dc3545'; break;
            default: messageArea.style.color = 'var(--accent-color)';
        }
    }

    function clearMessage() {
        messageArea.textContent = '';
        messageArea.style.color = 'var(--accent-color)'; // Reset color
    }

    function updateHintButton() {
        hintsLeftSpan.textContent = hintsRemaining;
        hintBtn.disabled = hintsRemaining <= 0 || !selectedCell; // Disable if no hints or no cell selected
    }

    function isBoardComplete() {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (currentBoard[r][c] === 0) {
                    return false;
                }
            }
        }
        return true;
    }

    function isBoardCorrect() {
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                if (currentBoard[r][c] !== solutionBoard[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    // --- Event Listeners Setup ---
    newGameBtn.addEventListener('click', handleNewGame);
    validateBtn.addEventListener('click', handleValidate);
    hintBtn.addEventListener('click', handleHint);
    resetBtn.addEventListener('click', handleReset);
    eraseBtn.addEventListener('click', handleErase);
    difficultySelect.addEventListener('change', handleNewGame); // Start new game on difficulty change

     // Add listener to deselect cell if clicking outside the board/numpad
    document.addEventListener('click', (event) => {
        if (!boardElement.contains(event.target) &&
            !document.querySelector('.numpad').contains(event.target) &&
            !event.target.closest('.action-buttons button') && // Don't deselect if clicking action buttons
            !event.target.closest('.controls button') && // Don't deselect if clicking control buttons
             selectedCell) {
            clearSelection();
        }
         // Update hint button state based on selection
         updateHintButton();
    });

     // Keyboard support (Optional but nice)
    document.addEventListener('keydown', (event) => {
        if (!selectedCell) return;

        const key = event.key;

        if (key >= '1' && key <= '9') {
            handleNumberInput(parseInt(key));
            event.preventDefault(); // Prevent typing in other inputs if any
        } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
            handleErase();
            event.preventDefault();
        } else if (key.startsWith('Arrow')) {
             // Move selection with arrow keys
            let { row, col } = selectedCell;
            switch (key) {
                case 'ArrowUp':    row = Math.max(0, row - 1); break;
                case 'ArrowDown':  row = Math.min(N - 1, row + 1); break;
                case 'ArrowLeft':  col = Math.max(0, col - 1); break;
                case 'ArrowRight': col = Math.min(N - 1, col + 1); break;
            }
             // Find the new cell element and select it, only if it's user-editable
            const nextCellElement = boardElement.querySelector(`.cell[data-row='${row}'][data-col='${col}']`);
            if (nextCellElement && initialBoard[row][col] === 0) {
                 selectCell(row, col, nextCellElement);
            }
            event.preventDefault();
        }
    });


    // --- Initial Setup ---
    createNumpad();
    initGame(); // Start the first game
});