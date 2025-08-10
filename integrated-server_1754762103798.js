const express = require('express');
const { createServer } = require('vite');
const path = require('path');

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '443197:AA06UhNbGOfUiUDvaPyfdRWFB9FCKZgEMEe';
const SEND_BOT_API_KEY = process.env.SEND_BOT_API_KEY || '';
const WALLET_API_KEY = process.env.WALLET_API_KEY || '';

// In-memory storage for development
const players = new Map();
const gameHistory = new Map();
const transactions = new Map();

async function createIntegratedServer() {
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  
  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      message: 'Golden Palace Casino API',
      telegram_connected: !!TELEGRAM_BOT_TOKEN,
      send_bot_connected: !!SEND_BOT_API_KEY,
      wallet_connected: !!WALLET_API_KEY
    });
  });
  
  // Player Management
  app.get('/api/player/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    
    if (!players.has(telegramId)) {
      // Create new player
      const newPlayer = {
        id: `player_${Date.now()}`,
        telegramId,
        username: `user_${telegramId}`,
        balance: 0.00,
        currency: 'USDT',
        createdAt: new Date().toISOString()
      };
      players.set(telegramId, newPlayer);
    }
    
    res.json(players.get(telegramId));
  });
  
  app.post('/api/player', (req, res) => {
    const { telegramId, username } = req.body;
    
    if (players.has(telegramId)) {
      return res.json(players.get(telegramId));
    }
    
    const newPlayer = {
      id: `player_${Date.now()}`,
      telegramId,
      username: username || `user_${telegramId}`,
      balance: 0.00,
      currency: 'USDT',
      createdAt: new Date().toISOString()
    };
    
    players.set(telegramId, newPlayer);
    res.json(newPlayer);
  });

  // Crypto Operations
  app.post('/api/crypto/deposit', async (req, res) => {
    try {
      const { telegramId, amount, currency = 'USDT' } = req.body;
      
      if (!players.has(telegramId)) {
        return res.status(404).json({ error: 'Игрок не найден' });
      }
      
      const transactionId = `dep_${Date.now()}`;
      const transaction = {
        id: transactionId,
        telegramId,
        type: 'deposit',
        amount: parseFloat(amount),
        currency,
        status: 'pending',
        createdAt: new Date().toISOString(),
        botMessage: `Для пополнения баланса на ${amount} ${currency} отправьте команду боту @send`
      };
      
      transactions.set(transactionId, transaction);
      
      // В реальной системе здесь будет интеграция с @send ботом
      res.json({
        success: true,
        transactionId,
        message: transaction.botMessage,
        sendBotUrl: `https://t.me/send?start=deposit_${transactionId}_${amount}_${currency}`
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при создании депозита' });
    }
  });

  app.post('/api/crypto/withdraw', async (req, res) => {
    try {
      const { telegramId, amount, walletAddress, currency = 'USDT' } = req.body;
      
      const player = players.get(telegramId);
      if (!player) {
        return res.status(404).json({ error: 'Игрок не найден' });
      }
      
      if (player.balance < parseFloat(amount)) {
        return res.status(400).json({ error: 'Недостаточно средств' });
      }
      
      const transactionId = `with_${Date.now()}`;
      const transaction = {
        id: transactionId,
        telegramId,
        type: 'withdrawal',
        amount: parseFloat(amount),
        currency,
        walletAddress,
        status: 'processing',
        createdAt: new Date().toISOString()
      };
      
      transactions.set(transactionId, transaction);
      
      // Списываем с баланса
      player.balance -= parseFloat(amount);
      players.set(telegramId, player);
      
      res.json({
        success: true,
        transactionId,
        message: 'Запрос на вывод создан и обрабатывается',
        status: 'processing'
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка при выводе средств' });
    }
  });

  app.get('/api/crypto/transactions/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const userTransactions = Array.from(transactions.values())
      .filter(t => t.telegramId === telegramId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(userTransactions);
  });

  // Game Endpoints - Slots
  app.post('/api/slots/:telegramId/spin', (req, res) => {
    try {
      const { telegramId } = req.params;
      const { betAmount } = req.body;
      
      const player = players.get(telegramId);
      if (!player || player.balance < betAmount) {
        return res.status(400).json({ error: 'Недостаточно средств' });
      }
      
      // Generate slots result
      const symbols = ["🍒", "🍋", "🍊", "🔔", "⭐", "💎", "7️⃣"];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];
      
      // Calculate winnings
      let winAmount = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        if (reels[0] === "7️⃣") winAmount = betAmount * 10;
        else if (reels[0] === "💎") winAmount = betAmount * 8;
        else if (reels[0] === "⭐") winAmount = betAmount * 6;
        else if (reels[0] === "🔔") winAmount = betAmount * 4;
        else winAmount = betAmount * 3;
      } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        winAmount = betAmount * 2;
      }
      
      // Update balance
      player.balance = player.balance - betAmount + winAmount;
      players.set(telegramId, player);
      
      // Save game history
      const historyId = `game_${Date.now()}`;
      gameHistory.set(historyId, {
        id: historyId,
        telegramId,
        gameType: 'slots',
        betAmount,
        winAmount,
        gameData: { reels },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        reels,
        winAmount,
        newBalance: player.balance,
        jackpot: winAmount >= betAmount * 5
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка игры' });
    }
  });

  // Blackjack endpoints
  app.post('/api/blackjack/:telegramId/start', (req, res) => {
    try {
      const { telegramId } = req.params;
      const { betAmount } = req.body;
      
      const player = players.get(telegramId);
      if (!player || player.balance < betAmount) {
        return res.status(400).json({ error: 'Недостаточно средств' });
      }
      
      // Create deck and deal cards
      const suits = ['♠', '♥', '♦', '♣'];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const deck = [];
      
      suits.forEach(suit => {
        ranks.forEach(rank => {
          deck.push({ suit, rank, value: rank === 'A' ? 11 : (rank === 'J' || rank === 'Q' || rank === 'K' ? 10 : parseInt(rank)) });
        });
      });
      
      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      
      const playerHand = [deck.pop(), deck.pop()];
      const dealerHand = [deck.pop(), deck.pop()];
      
      const gameId = `blackjack_${Date.now()}`;
      const gameState = {
        id: gameId,
        telegramId,
        betAmount,
        playerHand,
        dealerHand,
        deck,
        status: 'playing',
        createdAt: new Date().toISOString()
      };
      
      // Temporarily store game state (in real app, use database)
      gameHistory.set(gameId, gameState);
      
      res.json({
        gameId,
        playerHand,
        dealerVisibleCard: dealerHand[0],
        playerScore: calculateBlackjackScore(playerHand),
        canHit: true,
        canStand: true,
        canDouble: player.balance >= betAmount * 2
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка создания игры' });
    }
  });

  // Roulette endpoint
  app.post('/api/roulette/:telegramId/bet', (req, res) => {
    try {
      const { telegramId } = req.params;
      const { betAmount, betType, betValue } = req.body;
      
      const player = players.get(telegramId);
      if (!player || player.balance < betAmount) {
        return res.status(400).json({ error: 'Недостаточно средств' });
      }
      
      // Spin the wheel (0-36)
      const winningNumber = Math.floor(Math.random() * 37);
      const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
      const isBlack = winningNumber !== 0 && !isRed;
      
      let winAmount = 0;
      let win = false;
      
      switch (betType) {
        case 'number':
          if (winningNumber === parseInt(betValue)) {
            winAmount = betAmount * 35;
            win = true;
          }
          break;
        case 'red':
          if (isRed) {
            winAmount = betAmount * 2;
            win = true;
          }
          break;
        case 'black':
          if (isBlack) {
            winAmount = betAmount * 2;
            win = true;
          }
          break;
        case 'even':
          if (winningNumber > 0 && winningNumber % 2 === 0) {
            winAmount = betAmount * 2;
            win = true;
          }
          break;
        case 'odd':
          if (winningNumber > 0 && winningNumber % 2 === 1) {
            winAmount = betAmount * 2;
            win = true;
          }
          break;
      }
      
      // Update balance
      player.balance = player.balance - betAmount + winAmount;
      players.set(telegramId, player);
      
      // Save game history
      const historyId = `roulette_${Date.now()}`;
      gameHistory.set(historyId, {
        id: historyId,
        telegramId,
        gameType: 'roulette',
        betAmount,
        winAmount,
        gameData: { winningNumber, betType, betValue, win },
        timestamp: new Date().toISOString()
      });
      
      res.json({
        winningNumber,
        color: winningNumber === 0 ? 'green' : (isRed ? 'red' : 'black'),
        win,
        winAmount,
        newBalance: player.balance
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка игры в рулетку' });
    }
  });

  // Game history
  app.get('/api/history/:telegramId', (req, res) => {
    const { telegramId } = req.params;
    const userHistory = Array.from(gameHistory.values())
      .filter(h => h.telegramId === telegramId)
      .sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt))
      .slice(0, 50);
    
    res.json(userHistory);
  });

  // Helper function for blackjack score calculation
  function calculateBlackjackScore(hand) {
    let score = 0;
    let aces = 0;
    
    hand.forEach(card => {
      if (card.rank === 'A') {
        aces++;
        score += 11;
      } else {
        score += card.value;
      }
    });
    
    // Adjust for aces
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  }

  // Update player balance (for deposits)
  app.post('/api/player/:telegramId/balance', (req, res) => {
    try {
      const { telegramId } = req.params;
      const { amount } = req.body;
      
      const player = players.get(telegramId);
      if (!player) {
        return res.status(404).json({ error: 'Игрок не найден' });
      }
      
      player.balance += parseFloat(amount);
      players.set(telegramId, player);
      
      res.json({ 
        success: true, 
        newBalance: player.balance 
      });
    } catch (error) {
      res.status(500).json({ error: 'Ошибка обновления баланса' });
    }
  });

  // Create Vite dev server for frontend
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.join(process.cwd(), 'client'),
    configFile: path.join(process.cwd(), 'client', 'vite.config.ts'),
    resolve: {
      alias: {
        '@': path.join(process.cwd(), 'client', 'src'),
        '@assets': path.join(process.cwd(), 'client', 'src', 'assets'),
      }
    }
  });
  
  // Use Vite middleware for serving frontend
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
  
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎰 Golden Palace Casino running on port ${PORT}`);
    console.log(`🌐 Available at: http://localhost:${PORT}`);
  });
}

createIntegratedServer().catch(console.error);