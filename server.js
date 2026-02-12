const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let gameState = {
  players: [],
  currentRound: 1,
  totalRounds: 10,
  roundData: [],
  gameStarted: false,
  // Flags used by the client to drive round / game UX
  roundCompleted: false,
  gameCompleted: false,
  roundConfig: {
    totalRounds: 10,
    basePoints: 10, // Points per trick in round 1
    pointsIncrement: 10 // How much points increase each round
  },
  currentRoundState: {
    bets: [],
    tricksPlayed: 0,
    totalTricks: 0,
    trickWinners: [],
    phase: 'bets' // 'bets' or 'tricks'
  }
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Send current game state to new client
  socket.emit('gameState', gameState);
  
  // Handle game setup
  socket.on('setupGame', (data) => {
    gameState.players = data.players.map((name, index) => ({
      id: index + 1,
      name: name,
      score: 0,
      rank: 0,
      rankHistory: []
    }));
    
    // Update round configuration if provided
    if (data.roundConfig) {
      gameState.roundConfig = {
        totalRounds: data.roundConfig.totalRounds || 10,
        basePoints: data.roundConfig.basePoints || 10,
        pointsIncrement: data.roundConfig.pointsIncrement || 10
      };
    }
    
    gameState.totalRounds = gameState.roundConfig.totalRounds;
    gameState.gameStarted = true;
    gameState.gameCompleted = false;
    gameState.roundCompleted = false;
    gameState.currentRound = 1;
    gameState.roundData = [];
    
    // Initialize current round state
    initializeRoundState();
    
    // Broadcast updated state to all clients
    io.emit('gameState', gameState);
  });
  
  // Handle bet submission for current round
  socket.on('submitBets', (bets) => {
    if (gameState.currentRoundState.phase !== 'bets') {
      socket.emit('validationError', 'Bets have already been submitted for this round');
      return;
    }
    
    gameState.currentRoundState.bets = bets;
    gameState.currentRoundState.phase = 'tricks';
    
    // Broadcast updated state to all clients
    io.emit('gameState', gameState);
  });
  
  // Handle trick winner selection
  socket.on('submitTrickWinner', (data) => {
    if (gameState.currentRoundState.phase !== 'tricks') {
      socket.emit('validationError', 'Must submit bets before playing tricks');
      return;
    }
    
    const { playerId } = data;
    const player = gameState.players.find(p => p.id === playerId);
    
    if (!player) {
      socket.emit('validationError', 'Invalid player selected');
      return;
    }
    
    gameState.currentRoundState.trickWinners.push(playerId);
    gameState.currentRoundState.tricksPlayed++;
    
    // Check if round is complete
    if (gameState.currentRoundState.tricksPlayed >= gameState.currentRoundState.totalTricks) {
      completeRound();
    }
    
    // Broadcast updated state to all clients
    io.emit('gameState', gameState);
  });
  
  // Handle undo last trick
  socket.on('undoLastTrick', () => {
    if (gameState.currentRoundState.phase === 'tricks' && gameState.currentRoundState.tricksPlayed > 0) {
      gameState.currentRoundState.trickWinners.pop();
      gameState.currentRoundState.tricksPlayed--;
      
      io.emit('gameState', gameState);
    }
  });

  // Handle edit trick winner (change who won a specific trick)
  socket.on('editTrickWinner', (data) => {
    const { trickIndex, playerId } = data;
    if (gameState.currentRoundState.phase !== 'tricks') return;
    const winners = gameState.currentRoundState.trickWinners;
    if (trickIndex < 0 || trickIndex >= winners.length) return;
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    winners[trickIndex] = playerId;
    io.emit('gameState', gameState);
  });
  
  // Handle undo last action (complete round)
  socket.on('undoLastAction', () => {
    if (gameState.roundData.length > 0) {
      // Remove last round data
      const lastRound = gameState.roundData.pop();
      
      // Revert scores
      lastRound.scores.forEach((playerScore, index) => {
        if (index < gameState.players.length) {
          gameState.players[index].score = playerScore.score;
        }
      });
      
      // Go back to previous round
      if (gameState.currentRound > 1) {
        gameState.currentRound--;
        initializeRoundState();
      } else {
        gameState.gameStarted = false;
      }
      
      // Update rankings
      updateRankings();
      
      // Broadcast updated state
      io.emit('gameState', gameState);
    }
  });
  
  // Handle new game
  socket.on('newGame', () => {
    gameState = {
      players: [],
      currentRound: 1,
      totalRounds: 10,
      roundData: [],
      gameStarted: false,
      roundCompleted: false,
      gameCompleted: false,
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
    io.emit('gameState', gameState);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Helper function to initialize round state
function initializeRoundState() {
  const totalTricks = gameState.roundConfig.totalRounds - gameState.currentRound + 1;
  gameState.currentRoundState = {
    bets: [],
    tricksPlayed: 0,
    totalTricks: totalTricks,
    trickWinners: [],
    phase: 'bets'
  };
  // Reset per-round flag whenever a new round starts
  gameState.roundCompleted = false;
}

// Helper function to complete a round
function completeRound() {
  // Calculate scores for this round
  const trickWorth = gameState.roundConfig.basePoints + (gameState.currentRound - 1) * gameState.roundConfig.pointsIncrement;
  
  // Count tricks won by each player
  const tricksWon = {};
  gameState.players.forEach(player => {
    tricksWon[player.id] = 0;
  });
  
  gameState.currentRoundState.trickWinners.forEach(winnerId => {
    tricksWon[winnerId]++;
  });
  
  // Calculate round scores
  gameState.currentRoundState.bets.forEach((bet, index) => {
    const player = gameState.players[index];
    const actualTricksWon = tricksWon[player.id];
    let roundScore = 0;
    
    if (bet.tricksBet === actualTricksWon) {
      roundScore = trickWorth * actualTricksWon;
    } else {
      roundScore = -Math.abs(bet.tricksBet - actualTricksWon) * trickWorth;
    }
    
    player.score += roundScore;
  });
  
  // Store round data
  const roundRecord = {
    round: gameState.currentRound,
    trickWorth: trickWorth,
    bets: gameState.currentRoundState.bets,
    trickWinners: gameState.currentRoundState.trickWinners,
    tricksWon: tricksWon,
    scores: gameState.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
  };
  gameState.roundData.push(roundRecord);
  
  // Update rankings
  updateRankings();
  
  // Mark round as completed for the client
  gameState.roundCompleted = true;
  gameState.gameCompleted = false;

  // Emit a per-round completion event for all clients
  // (clients use this together with the gameState snapshot to show a leaderboard)
  if (gameState.currentRound < gameState.totalRounds) {
    io.emit('roundCompleted', {
      round: gameState.currentRound
    });
  }

  // Move to next round or end game
  if (gameState.currentRound < gameState.totalRounds) {
    gameState.currentRound++;
    initializeRoundState();
  } else {
    gameState.gameStarted = false;
    gameState.gameCompleted = true;

    // Notify clients that the game has fully completed
    io.emit('gameCompleted', {
      totalRounds: gameState.totalRounds
    });
  }
}

// Helper function to update player rankings
function updateRankings() {
  // Sort players by score (descending)
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  
  // Update rankings
  sortedPlayers.forEach((player, index) => {
    const originalPlayer = gameState.players.find(p => p.id === player.id);
    if (originalPlayer) {
      originalPlayer.rank = index + 1;
      originalPlayer.rankHistory.push({
        round: gameState.currentRound - 1,
        rank: index + 1,
        score: player.score
      });
    }
  });
}

// Serve the main HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Stomp Dashboard server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
}); 