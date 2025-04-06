document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const fenInput = document.getElementById('fenInput');
    const copyFenBtn = document.getElementById('copyFenBtn');
    const flipBoardBtn = document.getElementById('flipBoardBtn');
    const resetBtn = document.getElementById('resetBtn');
    const undoBtn = document.getElementById('undoBtn');
    const activeColorRadios = document.getElementsByName('activeColor');
    const updateColorBtn = document.getElementById('updateColorBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const exportLichessBtn = document.getElementById('exportLichessBtn');
    const exportChesscomBtn = document.getElementById('exportChesscomBtn');
    const moveHistoryElement = document.getElementById('moveHistory');
    const evalValue = document.getElementById('evalValue');
    const bestMove = document.getElementById('bestMove');
    
    // Create error message element
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.style.display = 'none';
    document.querySelector('.board-section').insertBefore(errorMessage, document.querySelector('.board-controls'));
    
    // Chess variables
    let board = null;
    let game = new Chess();
    let boardOrientation = 'white';
    let moveCounter = 1;
    let movesHistory = [];
    
    // Get FEN from session storage or use default
    const defaultFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const storedFen = sessionStorage.getItem('fenNotation') || defaultFen;
    const storedActiveColor = sessionStorage.getItem('activeColor') || 'w';
    const activeColorConfidence = sessionStorage.getItem('activeColorConfidence') || 'medium';
    const analysisMessage = sessionStorage.getItem('analysisMessage');
    
    // Show notification if active color confidence is low
    if (activeColorConfidence === 'low' && analysisMessage) {
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification';
        notificationElement.innerHTML = `
            <i class="fas fa-info-circle"></i>
            ${analysisMessage}
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        document.querySelector('.container').insertBefore(notificationElement, document.querySelector('.analysis-main'));
        
        // Add close button functionality
        document.querySelector('.close-notification').addEventListener('click', function() {
            notificationElement.style.display = 'none';
        });
    }
    
    // Set initial active color radio
    for (let radio of activeColorRadios) {
        if (radio.value === storedActiveColor) {
            radio.checked = true;
        }
    }
    
    // Initialize the board with FEN
    initializeBoard(storedFen);
    
    // Event Listeners
    copyFenBtn.addEventListener('click', copyFenToClipboard);
    flipBoardBtn.addEventListener('click', flipBoard);
    resetBtn.addEventListener('click', resetBoard);
    undoBtn.addEventListener('click', undoMove);
    updateColorBtn.addEventListener('click', updateActiveColor);
    analyzeBtn.addEventListener('click', analyzePosition);
    exportLichessBtn.addEventListener('click', exportToLichess);
    exportChesscomBtn.addEventListener('click', exportToChesscom);
    
    // Initialize the chess board
    function initializeBoard(fen) {
        try {
            // Hide any previous error
            errorMessage.style.display = 'none';
            
            // Validate FEN
            game = new Chess(fen);
            
            // Update FEN display
            fenInput.value = game.fen();
            
            // Board configuration
            const config = {
                draggable: true,
                position: game.fen(),
                orientation: boardOrientation,
                onDragStart: onDragStart,
                onDrop: onDrop,
                onSnapEnd: onSnapEnd,
                pieceTheme: '../static/images/chess_pieces/{piece}.png'
            };
            
            // Initialize or update the board
            if (board === null) {
                board = Chessboard('board', config);
            } else {
                board.position(game.fen(), false);
            }
            
            // Update move history display
            updateMoveHistory();
            
            // Highlight the active color option based on the current turn
            highlightActiveColor(game.turn());
            
        } catch (error) {
            console.error('Invalid FEN:', error);
            showError('Invalid FEN notation. Using default position.');
            
            // Use default position
            game = new Chess();
            fenInput.value = game.fen();
            board = Chessboard('board', {
                draggable: true,
                position: 'start',
                orientation: boardOrientation,
                onDragStart: onDragStart,
                onDrop: onDrop,
                onSnapEnd: onSnapEnd,
                pieceTheme: '../static/images/chess_pieces/{piece}.png'
            });
            
            // Highlight the active color option
            highlightActiveColor(game.turn());
        }
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // Highlight the active color option based on the current turn
    function highlightActiveColor(color) {
        for (let radio of activeColorRadios) {
            const colorOption = radio.parentElement;
            if (radio.value === color) {
                colorOption.style.backgroundColor = '#e6f7ff';
                radio.checked = true;
            } else {
                colorOption.style.backgroundColor = '';
            }
        }
    }
    
    // Chess board drag start
    function onDragStart(source, piece, position, orientation) {
        // Do not allow pieces to be dragged if the game is over
        if (game.game_over()) return false;
        
        // Only allow the current player to move pieces
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }
    
    // Chess board piece drop
    function onDrop(source, target) {
        // Check if the move is legal
        const move = game.move({
            from: source,
            to: target,
            promotion: 'q' // Always promote to queen for simplicity
        });
        
        // If the move is illegal, return the piece to its original position
        if (move === null) return 'snapback';
        
        // Add move to history
        movesHistory.push(move);
        
        // Update the FEN input with the new position
        fenInput.value = game.fen();
        
        // Update the move history display
        updateMoveHistory();
        
        // Highlight the active color option
        highlightActiveColor(game.turn());
    }
    
    // After a piece snap
    function onSnapEnd() {
        board.position(game.fen());
    }
    
    // Update move history display
    function updateMoveHistory() {
        // Clear the current move history
        moveHistoryElement.innerHTML = '';
        
        // Create headers
        const moveHeader = document.createElement('div');
        moveHeader.textContent = '#';
        moveHeader.className = 'move-header';
        
        const whiteHeader = document.createElement('div');
        whiteHeader.textContent = 'White';
        whiteHeader.className = 'move-header';
        
        const blackHeader = document.createElement('div');
        blackHeader.textContent = 'Black';
        blackHeader.className = 'move-header';
        
        moveHistoryElement.appendChild(moveHeader);
        moveHistoryElement.appendChild(whiteHeader);
        moveHistoryElement.appendChild(blackHeader);
        
        // Get move history from the game
        const history = game.history({ verbose: true });
        
        // Display moves in pairs (white and black)
        let moveCount = 1;
        
        for (let i = 0; i < history.length; i += 2) {
            // Move number
            const moveNumberDiv = document.createElement('div');
            moveNumberDiv.textContent = moveCount;
            moveNumberDiv.className = 'move-number';
            
            // White's move
            const whiteMoveDiv = document.createElement('div');
            whiteMoveDiv.textContent = history[i] ? history[i].san : '';
            whiteMoveDiv.className = 'move-text';
            
            // Black's move
            const blackMoveDiv = document.createElement('div');
            blackMoveDiv.textContent = history[i + 1] ? history[i + 1].san : '';
            blackMoveDiv.className = 'move-text';
            
            moveHistoryElement.appendChild(moveNumberDiv);
            moveHistoryElement.appendChild(whiteMoveDiv);
            moveHistoryElement.appendChild(blackMoveDiv);
            
            moveCount++;
        }
    }
    
    // Flip the board orientation
    function flipBoard() {
        boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
        board.orientation(boardOrientation);
    }
    
    // Reset the board to the initial position
    function resetBoard() {
        game = new Chess(storedFen);
        board.position(game.fen());
        fenInput.value = game.fen();
        movesHistory = [];
        updateMoveHistory();
        
        // Highlight the active color option
        highlightActiveColor(game.turn());
    }
    
    // Undo the last move
    function undoMove() {
        if (movesHistory.length === 0) return;
        
        game.undo();
        movesHistory.pop();
        board.position(game.fen());
        fenInput.value = game.fen();
        updateMoveHistory();
        
        // Highlight the active color option
        highlightActiveColor(game.turn());
    }
    
    // Copy FEN to clipboard
    function copyFenToClipboard() {
        fenInput.select();
        document.execCommand('copy');
        
        // Visual feedback
        const originalContent = copyFenBtn.innerHTML;
        copyFenBtn.innerHTML = '<img src="../static/images/successfully-attached.png" alt="Copied" class="success-icon">';
        setTimeout(() => {
            copyFenBtn.innerHTML = originalContent;
        }, 1500);
    }
    
    // Update active color
    function updateActiveColor() {
        let activeColor = 'w';
        
        // Get selected color
        for (let radio of activeColorRadios) {
            if (radio.checked) {
                activeColor = radio.value;
                break;
            }
        }
        
        // Get current FEN parts
        const fenParts = game.fen().split(' ');
        
        // Update the active color part (the second part)
        fenParts[1] = activeColor;
        
        // Create the new FEN
        const newFen = fenParts.join(' ');
        
        // Update the game and board
        try {
            game = new Chess(newFen);
            board.position(game.fen());
            fenInput.value = game.fen();
            
            // Highlight the active color option
            highlightActiveColor(game.turn());
        } catch (error) {
            console.error('Error updating active color:', error);
            showError('Error updating active color');
        }
    }
    
    // Analyze position with chess engine
    function analyzePosition() {
        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        
        // Send the FEN to the backend for analysis
        fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fen: game.fen()
            })
        })
        .then(response => response.json())
        .then(data => {
            // Update evaluation display
            const evaluation = data.evaluation || 0;
            const bestMoveText = data.best_move || '---';
            
            // Calculate evaluation bar width
            const evalPercent = Math.min(Math.max((evaluation + 5) / 10 * 100, 0), 100);
            evalValue.style.width = evalPercent + '%';
            
            // Display best move
            bestMove.textContent = 'Best move: ' + bestMoveText;
            
            // Reset button
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Position';
        })
        .catch(error => {
            console.error('Error analyzing position:', error);
            
            // Show error message
            showError('Error analyzing position: ' + error.message);
            
            // Reset button
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-search"></i> Analyze Position';
            
            // Show local evaluation
            bestMove.textContent = 'Engine analysis unavailable';
        });
    }
    
    // Export to Lichess
    function exportToLichess() {
        const lichessUrl = 'https://lichess.org/analysis/' + game.fen().replace(/ /g, '_');
        window.open(lichessUrl, '_blank');
    }
    
    // Export to Chess.com
    function exportToChesscom() {
        const chesscomUrl = 'https://www.chess.com/analysis?fen=' + encodeURIComponent(game.fen());
        window.open(chesscomUrl, '_blank');
    }
}); 