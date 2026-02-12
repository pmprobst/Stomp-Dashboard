// Socket.IO connection
const socket = io();

// Global variables
let gameState = {
    players: [],
    currentRound: 1,
    totalRounds: 10,
    roundData: [],
    gameStarted: false,
    roundConfig: {
        totalRounds: 10,
        basePoints: 10,
        pointsIncrement: 10
    },
    currentRoundState: {
        bets: [],
        tricksPlayed: 0,
        totalTricks: 0,
        trickWinners: [],
        phase: 'bets'
    }
};

let displayThresholds = {
    top: 3,
    bottom: 3
};

// When true, game page shows scoreboard block; when false, shows round entry block
let showingScoreboardAfterRound = false;

// DOM elements
const playerCountInput = document.getElementById('playerCount');
const playerNamesContainer = document.getElementById('playerNames');
const totalRoundsInput = document.getElementById('totalRounds');
const basePointsInput = document.getElementById('basePoints');
const pointsIncrementInput = document.getElementById('pointsIncrement');
const startGameBtn = document.getElementById('startGame');
const currentRoundSpan = document.getElementById('currentRound');
const totalRoundsDisplay = document.getElementById('totalRoundsDisplay');
const trickWorthSpan = document.getElementById('trickWorth');
const tricksInRoundSpan = document.getElementById('tricksInRound');
const roundProgressFill = document.getElementById('roundProgress');
const topPlayersContainer = document.getElementById('topPlayers');
const bottomPlayersContainer = document.getElementById('bottomPlayers');
const fullRankingsContainer = document.getElementById('fullRankings');
const betInputForm = document.getElementById('betInputForm');
const roundInputNumber = document.getElementById('roundInputNumber');
const submitBetsBtn = document.getElementById('submitBets');
const restartGameBtn = document.getElementById('restartGameBtn');
const nextRoundButtonRow = document.getElementById('nextRoundButtonRow');
const roundSummaryContainer = document.getElementById('roundSummary');
const gameHistoryContainer = document.getElementById('gameHistory');
const gameScoreboardBlock = document.getElementById('gameScoreboardBlock');
const gameRoundEntryBlock = document.getElementById('gameRoundEntryBlock');
const nextRoundBtn = document.getElementById('nextRoundBtn');
const finalStandingsList = document.getElementById('finalStandingsList');
const finalStandingsRestartBtn = document.getElementById('finalStandingsRestartBtn');
const betPlacedCountEl = document.getElementById('betPlacedCount');
const betPlacedTotalEl = document.getElementById('betPlacedTotal');
const historyOverlay = document.getElementById('historyOverlay');
const gameHistoryBtn = document.getElementById('gameHistoryBtn');
const errorModal = document.getElementById('errorModal');
const errorMessage = document.getElementById('errorMessage');

// Threshold selector elements
const topThresholdInput = document.getElementById('topThreshold');
const bottomThresholdInput = document.getElementById('bottomThreshold');
const updateThresholdsBtn = document.getElementById('updateThresholds');
const topThresholdDisplay = document.getElementById('topThresholdDisplay');
const bottomThresholdDisplay = document.getElementById('bottomThresholdDisplay');

// Trick phase elements
const betPhase = document.getElementById('betPhase');
const trickPhase = document.getElementById('trickPhase');
const trickRoundNumber = document.getElementById('trickRoundNumber');
const currentTrickSpan = document.getElementById('currentTrick');
const totalTricksSpan = document.getElementById('totalTricks');
const trickProgressFill = document.getElementById('trickProgressFill');
const trickWinnerButtonsContainer = document.getElementById('trickWinnerButtons');
const trickHistoryContainer = document.getElementById('trickHistory');

// Navigation elements
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');
const undoLastBtnNav = document.getElementById('undoLastBtn');

// Event listeners
playerCountInput.addEventListener('change', generatePlayerNameInputs);
startGameBtn.addEventListener('click', startGame);
submitBetsBtn.addEventListener('click', submitBets);
if (undoLastBtnNav) undoLastBtnNav.addEventListener('click', undoLastAction);
if (restartGameBtn) restartGameBtn.addEventListener('click', newGame);
if (finalStandingsRestartBtn) finalStandingsRestartBtn.addEventListener('click', newGame);
if (gameHistoryBtn) gameHistoryBtn.addEventListener('click', toggleGameHistory);
document.querySelector('.history-overlay-close')?.addEventListener('click', closeGameHistory);
if (historyOverlay) historyOverlay.addEventListener('click', (e) => { if (e.target === historyOverlay) closeGameHistory(); });
updateThresholdsBtn.addEventListener('click', updateThresholds);
nextRoundBtn.addEventListener('click', showNextRound);

// Navigation: Restart Game has data-page="setup"; Game History toggles overlay; Undo is action-only
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPage = btn.getAttribute('data-page');
        if (targetPage) navigateToPage(targetPage);
    });
});

function toggleGameHistory() {
    if (!historyOverlay) return;
    const isOpen = historyOverlay.classList.contains('open');
    if (isOpen) {
        closeGameHistory();
    } else {
        historyOverlay.classList.add('open');
        historyOverlay.setAttribute('aria-hidden', 'false');
        updateGameHistory();
        if (gameHistoryBtn) gameHistoryBtn.classList.add('active');
    }
}

function closeGameHistory() {
    if (!historyOverlay) return;
    historyOverlay.classList.remove('open');
    historyOverlay.setAttribute('aria-hidden', 'true');
    if (gameHistoryBtn) gameHistoryBtn.classList.remove('active');
}

// Modal close functionality
document.querySelector('.close').addEventListener('click', () => {
    errorModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === errorModal) {
        errorModal.style.display = 'none';
    }
});

// Socket.IO event handlers
socket.on('gameState', (state) => {
    gameState = state;
    updateUI();
});

socket.on('validationError', (message) => {
    showError(message);
});

socket.on('roundCompleted', () => {
    showingScoreboardAfterRound = true;
    if (document.querySelector('.page.active').id === 'game') {
        nextRoundButtonRow.style.display = 'block';
        gameScoreboardBlock.style.display = 'block';
        gameRoundEntryBlock.style.display = 'none';
        updateScoreboard();
    }
});

socket.on('gameCompleted', () => {
    // Last round just finished – go to final standings (handled in updateUI when gameState arrives)
    showingScoreboardAfterRound = false;
});

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    generatePlayerNameInputs();
    updateUI();
});

// Navigation function (pages: setup, game, history)
function navigateToPage(pageId) {
    navButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-page') === pageId) {
            btn.classList.add('active');
        }
    });
    pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageId) {
            page.classList.add('active');
        }
    });
    updatePageContent(pageId);
}

// Update specific page content
function updatePageContent(pageId) {
    switch (pageId) {
        case 'setup':
            break;
        case 'game':
            updateRoundProgress();
            if (showingScoreboardAfterRound) {
                updateScoreboard();
            } else {
                updateRoundManagement();
                updateRoundSummary();
            }
            break;
        case 'finalStandings':
            updateFinalStandings();
            break;
    }
}

// Populate final standings page (when game is complete)
function updateFinalStandings() {
    if (!finalStandingsList) return;
    if (!gameState.players || gameState.players.length === 0) {
        finalStandingsList.innerHTML = '<p>No results.</p>';
        return;
    }
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    finalStandingsList.innerHTML = sorted.map((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? '1st' : rank === 2 ? '2nd' : rank === 3 ? '3rd' : `${rank}th`;
        return `
            <div class="final-standing-row final-standing-rank-${rank}">
                <span class="final-standing-medal">${medal}</span>
                <span class="final-standing-name">${player.name}</span>
                <span class="final-standing-score">${player.score} pts</span>
            </div>
        `;
    }).join('');
}

// Update thresholds
function updateThresholds() {
    const topThreshold = parseInt(topThresholdInput.value);
    const bottomThreshold = parseInt(bottomThresholdInput.value);
    
    // Validate thresholds
    if (isNaN(topThreshold) || topThreshold < 1 || topThreshold > 20) {
        showError('Top threshold must be between 1 and 20');
        return;
    }
    
    if (isNaN(bottomThreshold) || bottomThreshold < 1 || bottomThreshold > 20) {
        showError('Bottom threshold must be between 1 and 20');
        return;
    }
    
    // Update display thresholds
    displayThresholds.top = topThreshold;
    displayThresholds.bottom = bottomThreshold;
    
    // Update display labels
    topThresholdDisplay.textContent = topThreshold;
    bottomThresholdDisplay.textContent = bottomThreshold;
    
    // Update scoreboard
    updateScoreboard();
}

// Generate player name input fields (list); preserve existing names when count changes
function generatePlayerNameInputs() {
    const existingInputs = playerNamesContainer.querySelectorAll('.player-name-input');
    const savedNames = Array.from(existingInputs).map(input => input.value.trim());
    const playerCount = parseInt(playerCountInput.value);
    playerNamesContainer.innerHTML = '';
    for (let i = 0; i < playerCount; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Player ${i + 1} Name`;
        input.required = true;
        input.className = 'player-name-input';
        if (savedNames[i]) input.value = savedNames[i];
        playerNamesContainer.appendChild(input);
    }
}

// Start the game
function startGame() {
    const playerCount = parseInt(playerCountInput.value);
    const playerNameInputs = document.querySelectorAll('.player-name-input');
    const players = [];
    
    // Validate player count
    if (playerCount < 2 || playerCount > 20) {
        showError('Number of players must be between 2 and 20');
        return;
    }
    
    // Collect player names
    for (let i = 0; i < playerCount; i++) {
        const name = playerNameInputs[i].value.trim();
        if (!name) {
            showError(`Please enter a name for Player ${i + 1}`);
            return;
        }
        players.push(name);
    }
    
    // Check for duplicate names
    const uniqueNames = new Set(players);
    if (uniqueNames.size !== players.length) {
        showError('All player names must be unique');
        return;
    }
    
    // Get game configuration
    const roundConfig = {
        totalRounds: parseInt(totalRoundsInput.value) || 10,
        basePoints: parseInt(basePointsInput.value) || 10,
        pointsIncrement: parseInt(pointsIncrementInput.value) || 10
    };
    
    // Validate configuration
    if (roundConfig.totalRounds < 1 || roundConfig.totalRounds > 20) {
        showError('Total rounds must be between 1 and 20');
        return;
    }
    
    if (roundConfig.basePoints < 1 || roundConfig.basePoints > 100) {
        showError('Base points must be between 1 and 100');
        return;
    }
    
    if (roundConfig.pointsIncrement < 1 || roundConfig.pointsIncrement > 50) {
        showError('Points increment must be between 1 and 50');
        return;
    }
    
    // Send game setup to server
    socket.emit('setupGame', { players, roundConfig });
}

// Submit bets for current round
function submitBets() {
    const betInputs = document.querySelectorAll('.bet-input-row');
    const bets = [];
    
    for (let input of betInputs) {
        const tricksBet = parseInt(input.querySelector('.tricks-bet').value);
        
        if (isNaN(tricksBet) || tricksBet < 0) {
            showError('Please enter valid bet numbers for all players');
            return;
        }
        
        bets.push({ tricksBet });
    }
    
    socket.emit('submitBets', bets);
}

// Submit trick winner (called when a player button is clicked)
function submitTrickWinner(playerId) {
    socket.emit('submitTrickWinner', { playerId: parseInt(playerId, 10) });
}

// Undo last trick
function undoLastTrick() {
    socket.emit('undoLastTrick');
}

// Undo last action
function undoLastAction() {
    socket.emit('undoLastAction');
}

// New game
function newGame() {
    socket.emit('newGame');
    navigateToPage('setup');
}

// Switch from scoreboard view back to round entry (Next Round)
function showNextRound() {
    showingScoreboardAfterRound = false;
    nextRoundButtonRow.style.display = 'none';
    gameScoreboardBlock.style.display = 'none';
    gameRoundEntryBlock.style.display = 'block';
    updateRoundManagement();
    updateRoundSummary();
}

// Update the UI based on current game state
function updateUI() {
    if (gameState.gameStarted) {
        navButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
        });
        if (document.querySelector('.page.active').id === 'setup') {
            showingScoreboardAfterRound = false;
            navigateToPage('game');
            if (nextRoundButtonRow) nextRoundButtonRow.style.display = 'none';
            gameScoreboardBlock.style.display = 'none';
            gameRoundEntryBlock.style.display = 'block';
        }
        updateRoundProgress();
        updateScoreboard();
        updateRoundManagement();
        updateRoundSummary();
        updateGameHistory();
        if (document.querySelector('.page.active').id === 'game') {
            if (showingScoreboardAfterRound) {
                nextRoundButtonRow.style.display = 'block';
                gameScoreboardBlock.style.display = 'block';
                gameRoundEntryBlock.style.display = 'none';
            } else {
                nextRoundButtonRow.style.display = 'none';
                gameScoreboardBlock.style.display = 'none';
                gameRoundEntryBlock.style.display = 'block';
            }
        }
    } else {
        showingScoreboardAfterRound = false;
        if (gameState.gameCompleted && gameState.players && gameState.players.length > 0) {
            navButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
            });
            navigateToPage('finalStandings');
            updateFinalStandings();
        } else {
            navButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
            });
            if (document.querySelector('.page.active').id !== 'setup') {
                navigateToPage('setup');
            }
        }
    }
}

// Update round progress display
function updateRoundProgress() {
    currentRoundSpan.textContent = gameState.currentRound;
    totalRoundsDisplay.textContent = gameState.totalRounds;
    
    const trickWorth = gameState.roundConfig.basePoints + (gameState.currentRound - 1) * gameState.roundConfig.pointsIncrement;
    trickWorthSpan.textContent = trickWorth;
    
    const tricksInRound = gameState.currentRoundState.totalTricks;
    tricksInRoundSpan.textContent = tricksInRound;
    
    const progressPercentage = ((gameState.currentRound - 1) / gameState.totalRounds) * 100;
    roundProgressFill.style.width = `${progressPercentage}%`;
}

// Update round management
function updateRoundManagement() {
    // Always update the round number display
    roundInputNumber.textContent = gameState.currentRound;
    trickRoundNumber.textContent = gameState.currentRound;
    
    if (!gameState.gameStarted) {
        // Show message that game needs to be started
        betPhase.style.display = 'block';
        trickPhase.style.display = 'none';
        betInputForm.innerHTML = '<p>Please start a game first to enter bets.</p>';
        return;
    }
    
    // Update trick progress
    currentTrickSpan.textContent = gameState.currentRoundState.tricksPlayed + 1;
    totalTricksSpan.textContent = gameState.currentRoundState.totalTricks;
    
    const trickProgressPercentage = (gameState.currentRoundState.tricksPlayed / gameState.currentRoundState.totalTricks) * 100;
    trickProgressFill.style.width = `${trickProgressPercentage}%`;
    
    // Show/hide phases based on current phase
    if (gameState.currentRoundState.phase === 'bets') {
        betPhase.style.display = 'block';
        trickPhase.style.display = 'none';
        updateBetForm();
    } else {
        betPhase.style.display = 'none';
        trickPhase.style.display = 'block';
        updateTrickForm();
        updateTrickHistory();
    }
}

// Update bet form (list)
function updateBetForm() {
    betInputForm.innerHTML = '';
    if (!gameState.players || gameState.players.length === 0) {
        betInputForm.innerHTML = '<p>No players found. Please start a game first.</p>';
        return;
    }
    const totalTricks = gameState.currentRoundState.totalTricks;
    if (betPlacedTotalEl) betPlacedTotalEl.textContent = totalTricks;
    gameState.players.forEach((player) => {
        const betRow = document.createElement('div');
        betRow.className = 'bet-input-row';
        betRow.innerHTML = `
            <div class="player-name">${player.name}</div>
            <input type="number" class="tricks-bet" placeholder="Bet" min="0" max="${totalTricks}" value="0">
        `;
        const input = betRow.querySelector('.tricks-bet');
        input.addEventListener('input', updateBetsPlacedRatio);
        input.addEventListener('change', updateBetsPlacedRatio);
        betInputForm.appendChild(betRow);
    });
    updateBetsPlacedRatio();
}

// Sum of all bet values (for ratio display: sum of bets / tricks in round)
function updateBetsPlacedRatio() {
    if (!betPlacedCountEl) return;
    const inputs = document.querySelectorAll('.tricks-bet');
    let sum = 0;
    inputs.forEach((input) => {
        const n = parseInt(input.value.trim(), 10);
        if (!isNaN(n) && n >= 0) sum += n;
    });
    betPlacedCountEl.textContent = sum;
}

// Update trick form: player buttons with wins/bet ratio (list), space between name and ratio
function updateTrickForm() {
    if (!trickWinnerButtonsContainer) return;
    trickWinnerButtonsContainer.innerHTML = '';
    const bets = gameState.currentRoundState.bets || [];
    const trickWinners = gameState.currentRoundState.trickWinners || [];
    gameState.players.forEach((player, index) => {
        const wins = trickWinners.filter(id => id === player.id).length;
        const bet = (bets[index] && typeof bets[index].tricksBet === 'number') ? bets[index].tricksBet : 0;
        const ratioText = `${wins}/${bet}`;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn trick-winner-btn';
        btn.innerHTML = `<span class="trick-winner-name">${player.name}</span> <span class="trick-winner-ratio">${ratioText}</span>`;
        btn.addEventListener('click', () => submitTrickWinner(player.id));
        trickWinnerButtonsContainer.appendChild(btn);
    });
}

// Update trick history: each row has trick number, winner (name or dropdown when editing), edit icon
function updateTrickHistory() {
    trickHistoryContainer.innerHTML = '';
    const trickWinners = gameState.currentRoundState.trickWinners || [];
    if (trickWinners.length === 0) {
        trickHistoryContainer.innerHTML = '<p>No tricks played yet.</p>';
        return;
    }
    trickWinners.forEach((winnerId, trickIndex) => {
        const player = gameState.players.find(p => p.id === winnerId);
        const trickItem = document.createElement('div');
        trickItem.className = 'trick-history-item trick-history-row';
        trickItem.dataset.trickIndex = trickIndex;
        trickItem.innerHTML = `
            <div class="trick-number">Trick ${trickIndex + 1}</div>
            <div class="trick-winner-cell">
                <span class="trick-winner-display">${player ? player.name : '?'}</span>
                <select class="trick-winner-edit-select" style="display: none;">
                    ${gameState.players.map(p => `<option value="${p.id}" ${p.id === winnerId ? 'selected' : ''}>${p.name}</option>`).join('')}
                </select>
            </div>
            <button type="button" class="trick-history-edit-btn" title="Edit winner" aria-label="Edit winner">
                <svg class="icon icon-pencil" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
        `;
        const displayEl = trickItem.querySelector('.trick-winner-display');
        const selectEl = trickItem.querySelector('.trick-winner-edit-select');
        const editBtn = trickItem.querySelector('.trick-history-edit-btn');
        editBtn.addEventListener('click', () => {
            displayEl.style.display = 'none';
            selectEl.style.display = 'inline-block';
            editBtn.style.display = 'none';
            selectEl.focus();
        });
        selectEl.addEventListener('change', () => {
            const newPlayerId = parseInt(selectEl.value, 10);
            socket.emit('editTrickWinner', { trickIndex, playerId: newPlayerId });
            displayEl.style.display = '';
            selectEl.style.display = 'none';
            editBtn.style.display = '';
        });
        selectEl.addEventListener('blur', () => {
            displayEl.style.display = '';
            selectEl.style.display = 'none';
            editBtn.style.display = '';
        });
        trickHistoryContainer.appendChild(trickItem);
    });
}

// Update scoreboard
function updateScoreboard() {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    
    // Update top players based on threshold
    topPlayersContainer.innerHTML = '';
    const topCount = Math.min(displayThresholds.top, sortedPlayers.length);
    for (let i = 0; i < topCount; i++) {
        const player = sortedPlayers[i];
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-score">${player.score} pts</span>
        `;
        topPlayersContainer.appendChild(playerItem);
    }
    
    // Update bottom players based on threshold
    bottomPlayersContainer.innerHTML = '';
    const bottomCount = Math.min(displayThresholds.bottom, sortedPlayers.length);
    for (let i = Math.max(0, sortedPlayers.length - bottomCount); i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const playerItem = document.createElement('div');
        playerItem.className = 'player-item';
        playerItem.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-score">${player.score} pts</span>
        `;
        bottomPlayersContainer.appendChild(playerItem);
    }
    
    // Update full rankings
    fullRankingsContainer.innerHTML = '';
    sortedPlayers.forEach((player, index) => {
        const rankingRow = document.createElement('div');
        rankingRow.className = 'ranking-row';
        
        // Calculate points needed for top threshold or bottom threshold
        const pointsToTop = index >= displayThresholds.top ? sortedPlayers[displayThresholds.top - 1].score - player.score : 0;
        const pointsToBottom = index < sortedPlayers.length - displayThresholds.bottom ? player.score - sortedPlayers[sortedPlayers.length - displayThresholds.bottom].score : 0;
        
        rankingRow.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-score">${player.score} pts</div>
            <div class="points-needed">
                ${pointsToTop > 0 ? `+${pointsToTop} to top ${displayThresholds.top}` : 
                  pointsToBottom > 0 ? `-${pointsToBottom} to bottom ${displayThresholds.bottom}` : ''}
            </div>
        `;
        fullRankingsContainer.appendChild(rankingRow);
    });
}

// Update round summary
function updateRoundSummary() {
    if (gameState.roundData.length === 0) {
        roundSummaryContainer.innerHTML = '<p>No rounds completed yet.</p>';
        return;
    }
    
    const lastRound = gameState.roundData[gameState.roundData.length - 1];
    let summaryHTML = `
        <div class="summary-row">
            <strong>Round ${lastRound.round}</strong>
            <span>Tricks worth ${lastRound.trickWorth} points each</span>
        </div>
    `;
    
    lastRound.bets.forEach((bet, index) => {
        const player = gameState.players[index];
        const actualTricksWon = lastRound.tricksWon[player.id] || 0;
        const roundScore = lastRound.scores[index].score - (index > 0 ? lastRound.scores[index - 1].score : 0);
        const scoreClass = roundScore >= 0 ? 'positive' : 'negative';
        
        summaryHTML += `
            <div class="summary-row">
                <span>${player.name}</span>
                <span>Bet: ${bet.tricksBet}, Won: ${actualTricksWon}</span>
                <span class="${scoreClass}">${roundScore >= 0 ? '+' : ''}${roundScore} pts</span>
            </div>
        `;
    });
    
    roundSummaryContainer.innerHTML = summaryHTML;
}

// Update game history
function updateGameHistory() {
    if (!gameHistoryContainer) return;
    if (gameState.roundData.length === 0 || !gameState.players.length) {
        gameHistoryContainer.innerHTML = '<p>No game history available yet.</p>';
        return;
    }
    
    let historyHTML = '';
    
    gameState.roundData.forEach((round, index) => {
        const roundNumber = round.round;
        const trickWorth = round.trickWorth;
        const totalTricks = round.trickWinners.length;
        
        historyHTML += `
            <div class="history-item">
                <div class="history-round">Round ${roundNumber}</div>
                <div class="history-details">
                    ${totalTricks} tricks worth ${trickWorth} points each
                </div>
            </div>
        `;
        
        // Add player results for this round
        round.bets.forEach((bet, playerIndex) => {
            const player = gameState.players[playerIndex];
            const actualTricksWon = round.tricksWon[player.id] || 0;
            const roundScore = round.scores[playerIndex].score - (playerIndex > 0 ? round.scores[playerIndex - 1].score : 0);
            const scoreClass = roundScore >= 0 ? 'positive' : 'negative';
            
            historyHTML += `
                <div class="history-item" style="padding-left: 20px; font-size: 0.9rem;">
                    <div>${player.name}: Bet ${bet.tricksBet}, Won ${actualTricksWon}</div>
                    <div class="${scoreClass}">${roundScore >= 0 ? '+' : ''}${roundScore} pts</div>
                </div>
            `;
        });
    });
    
    gameHistoryContainer.innerHTML = historyHTML;
}

// Show error modal
function showError(message) {
    errorMessage.textContent = message;
    errorModal.style.display = 'block';
}

// Add some CSS for the score classes
const style = document.createElement('style');
style.textContent = `
    .positive { color: #48bb78; font-weight: 600; }
    .negative { color: #f56565; font-weight: 600; }
    .points-needed { font-size: 0.9rem; color: #718096; }
    .nav-btn:disabled { cursor: not-allowed; }
`;
document.head.appendChild(style); 