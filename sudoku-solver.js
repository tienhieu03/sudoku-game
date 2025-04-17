// sudoku-solver.js

const N = 9;

// Function to check if a number is valid in the given position (Không đổi)
function isValid(board, row, col, num) {
    // Check row
    for (let x = 0; x < N; x++) {
        if (board[row][x] === num) {
            return false;
        }
    }
    // Check column
    for (let x = 0; x < N; x++) {
        if (board[x][col] === num) {
            return false;
        }
    }
    // Check 3x3 subgrid
    const startRow = row - (row % 3);
    const startCol = col - (col % 3);
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            if (board[i + startRow][j + startCol] === num) {
                return false;
            }
        }
    }
    return true;
}

// Function to find an empty cell (Không đổi)
function findEmpty(board) {
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            if (board[r][c] === 0) {
                return [r, c];
            }
        }
    }
    return null;
}

// Backtracking solver function (Không đổi)
function solveSudoku(board) {
    const find = findEmpty(board);
    let row, col;

    if (!find) {
        return true;
    } else {
        [row, col] = find;
    }

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);

    for (let num of numbers) {
        if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
                return true;
            }
            board[row][col] = 0;
        }
    }
    return false;
}

// Helper function to count clues in a region
function countClues(board, type, index) {
    let count = 0;
    if (type === 'row') {
        for (let c = 0; c < N; c++) {
            if (board[index][c] !== 0) count++;
        }
    } else if (type === 'col') {
        for (let r = 0; r < N; r++) {
            if (board[r][index] !== 0) count++;
        }
    } else if (type === 'box') {
        const startRow = Math.floor(index / 3) * 3;
        const startCol = (index % 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] !== 0) count++;
            }
        }
    }
    return count;
}


// *** NÂNG CẤP THUẬT TOÁN GENERATE SUDOKU ***
function generateSudoku(difficulty) {
    let board = Array(N).fill(null).map(() => Array(N).fill(0));
    solveSudoku(board); // Tạo bảng giải đầy đủ

    const solution = JSON.parse(JSON.stringify(board)); // Lưu lại bản giải

    let cellsToRemove;
    let minCluesPerRegion; // Số gợi ý tối thiểu còn lại trong mỗi hàng/cột/ô 3x3

    switch (difficulty) {
        case 'easy':
            cellsToRemove = 35; // Xóa ít hơn một chút
            minCluesPerRegion = 4; // Yêu cầu ít nhất 4 gợi ý/vùng
            break;
        case 'hard':
            cellsToRemove = 55; // Xóa nhiều hơn một chút
            minCluesPerRegion = 1; // Chỉ cần ít nhất 1 gợi ý (có thể là 0 nếu muốn khó hơn nữa)
            break;
        case 'medium':
        default:
            cellsToRemove = 45; // Số ô xóa trung bình
            minCluesPerRegion = 2; // Yêu cầu ít nhất 2 gợi ý/vùng
            break;
    }

    let removed = 0;
    let attempts = 0; // Bộ đếm số lần thử
    const maxAttempts = N * N * 10; // Giới hạn số lần thử để tránh treo

    // Tạo danh sách các ô có thể xóa (tránh xóa đi xóa lại cùng 1 ô)
    let potentialRemovals = [];
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            potentialRemovals.push({ r, c });
        }
    }
    shuffleArray(potentialRemovals); // Xáo trộn danh sách các ô

    let removalIndex = 0;
    while (removed < cellsToRemove && removalIndex < potentialRemovals.length && attempts < maxAttempts) {
        const { r, c } = potentialRemovals[removalIndex];
        attempts++; // Tăng bộ đếm thử

        if (board[r][c] === 0) { // Nếu ô này đã bị xóa rồi thì bỏ qua
            removalIndex++;
            continue;
        }

        // Tính số gợi ý hiện tại trong các vùng liên quan *TRƯỚC KHI* xóa
        const cluesInRow = countClues(board, 'row', r);
        const cluesInCol = countClues(board, 'col', c);
        const boxIndex = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        const cluesInBox = countClues(board, 'box', boxIndex);

        // Kiểm tra xem việc xóa có vi phạm số gợi ý tối thiểu không
        if (cluesInRow > minCluesPerRegion &&
            cluesInCol > minCluesPerRegion &&
            cluesInBox > minCluesPerRegion)
        {
            // Nếu không vi phạm -> Thực hiện xóa
            board[r][c] = 0;
            removed++;
        }
        // Dù xóa được hay không, cũng chuyển sang ô tiềm năng tiếp theo trong danh sách
        removalIndex++;
    }

     // Ghi log nếu không xóa đủ số ô mong muốn (do giới hạn hoặc ràng buộc)
     if (removed < cellsToRemove) {
        console.warn(`Sudoku Generation: Could only remove ${removed}/${cellsToRemove} cells for difficulty '${difficulty}' while maintaining min ${minCluesPerRegion} clues per region.`);
    }


    return { puzzle: board, solution: solution };
}


// Helper function to shuffle an array (Fisher-Yates) (Không đổi)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}