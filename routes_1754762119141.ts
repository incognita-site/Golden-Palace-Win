import { Request, Response, Router } from "express";
import { z } from "zod";
import { IStorage } from "./storage";
import { 
  insertPlayerSchema, 
  insertSlotsStateSchema, 
  insertBlackjackStateSchema, 
  insertRouletteStateSchema,
  insertGameHistorySchema,
  insertCryptoTransactionSchema,
  insertWithdrawalRequestSchema
} from "@shared/schema";

export function createRoutes(storage: IStorage): Router {
  const router = Router();

  // Health check endpoint
  router.get("/health", async (req: Request, res: Response) => {
    res.json({ status: "ok", message: "Golden Palace Casino API" });
  });

  // Player routes
  router.get("/player/:telegramId", async (req: Request, res: Response) => {
    try {
      const { telegramId } = req.params;
      const player = await storage.getPlayer(telegramId);
      
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      console.error("Error getting player:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/player", async (req: Request, res: Response) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      
      // Check if player already exists
      const existingPlayer = await storage.getPlayer(playerData.telegramId);
      if (existingPlayer) {
        return res.json(existingPlayer);
      }
      
      const player = await storage.createPlayer(playerData);
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating player:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.patch("/player/:telegramId/balance", async (req: Request, res: Response) => {
    try {
      const { telegramId } = req.params;
      const { balance } = z.object({ balance: z.number() }).parse(req.body);
      
      await storage.updatePlayerBalance(telegramId, balance);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating balance:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Game history routes
  router.get("/player/:playerId/history", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const history = await storage.getGameHistory(playerId);
      res.json(history);
    } catch (error) {
      console.error("Error getting game history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/game-history", async (req: Request, res: Response) => {
    try {
      const historyData = insertGameHistorySchema.parse(req.body);
      const history = await storage.addGameHistory(historyData);
      res.json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error adding game history:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Slots routes
  router.get("/slots/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getSlotsState(playerId);
      res.json(state);
    } catch (error) {
      console.error("Error getting slots state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/slots", async (req: Request, res: Response) => {
    try {
      const stateData = insertSlotsStateSchema.parse(req.body);
      const state = await storage.createSlotsState(stateData);
      res.json(state);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating slots state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/slots/:playerId/spin", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const { betAmount } = z.object({ betAmount: z.number().min(1) }).parse(req.body);
      
      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (player.balance < betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
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
        // Three of a kind
        if (reels[0] === "7️⃣") winAmount = betAmount * 10;
        else if (reels[0] === "💎") winAmount = betAmount * 8;
        else if (reels[0] === "⭐") winAmount = betAmount * 6;
        else if (reels[0] === "🔔") winAmount = betAmount * 4;
        else winAmount = betAmount * 3;
      } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        // Two of a kind
        winAmount = betAmount * 2;
      }
      
      // Update balance
      const newBalance = player.balance - betAmount + winAmount;
      await storage.updatePlayerBalance(player.telegramId, newBalance);
      
      // Add to history
      await storage.addGameHistory({
        playerId: player.id,
        gameType: "slots",
        betAmount,
        winAmount,
        gameData: JSON.stringify({ reels, symbols: reels })
      });
      
      res.json({
        reels,
        winAmount,
        newBalance,
        isWin: winAmount > 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error spinning slots:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Blackjack routes
  router.get("/blackjack/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getBlackjackState(playerId);
      res.json(state);
    } catch (error) {
      console.error("Error getting blackjack state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/blackjack/start", async (req: Request, res: Response) => {
    try {
      const { playerId, betAmount } = z.object({
        playerId: z.string(),
        betAmount: z.number().min(1)
      }).parse(req.body);
      
      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (player.balance < betAmount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Create deck and deal cards
      const suits = ["♠", "♥", "♦", "♣"];
      const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
      const deck: string[] = [];
      
      for (const suit of suits) {
        for (const rank of ranks) {
          deck.push(`${rank}${suit}`);
        }
      }
      
      // Shuffle deck
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      
      const playerCards = [deck.pop()!, deck.pop()!];
      const dealerCards = [deck.pop()!, deck.pop()!];
      
      const calculateScore = (cards: string[]): number => {
        let score = 0;
        let aces = 0;
        
        for (const card of cards) {
          const rank = card.slice(0, -1);
          if (rank === "A") {
            aces++;
            score += 11;
          } else if (["J", "Q", "K"].includes(rank)) {
            score += 10;
          } else {
            score += parseInt(rank);
          }
        }
        
        while (score > 21 && aces > 0) {
          score -= 10;
          aces--;
        }
        
        return score;
      };
      
      const playerScore = calculateScore(playerCards);
      const dealerScore = calculateScore(dealerCards);
      
      let gameStatus: "active" | "player_wins" | "dealer_wins" | "tie" | "blackjack" | "bust" = "active";
      
      if (playerScore === 21) {
        gameStatus = "blackjack";
      } else if (playerScore > 21) {
        gameStatus = "bust";
      }
      
      const state = await storage.createBlackjackState({
        playerId: player.id,
        playerCards,
        dealerCards,
        betAmount,
        gameStatus,
        playerScore,
        dealerScore,
        isActive: gameStatus === "active"
      });
      
      // Update balance immediately for bet
      await storage.updatePlayerBalance(player.telegramId, player.balance - betAmount);
      
      res.json(state);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error starting blackjack:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Roulette routes
  router.get("/roulette/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getRouletteState(playerId);
      res.json(state);
    } catch (error) {
      console.error("Error getting roulette state:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/roulette/spin", async (req: Request, res: Response) => {
    try {
      const { playerId, bets } = z.object({
        playerId: z.string(),
        bets: z.array(z.object({
          type: z.string(),
          value: z.union([z.number(), z.string()]),
          amount: z.number().min(1)
        }))
      }).parse(req.body);
      
      // Get player by ID (assuming playerId is actually telegramId for now)
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      const totalBet = bets.reduce((sum, bet) => sum + bet.amount, 0);
      
      if (player.balance < totalBet) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Spin the wheel
      const winningNumber = Math.floor(Math.random() * 37); // 0-36
      
      // Calculate winnings
      let totalWin = 0;
      
      for (const bet of bets) {
        let multiplier = 0;
        
        if (bet.type === "number" && bet.value === winningNumber) {
          multiplier = 35;
        } else if (bet.type === "red" && winningNumber > 0 && isRedNumber(winningNumber)) {
          multiplier = 1;
        } else if (bet.type === "black" && winningNumber > 0 && !isRedNumber(winningNumber)) {
          multiplier = 1;
        } else if (bet.type === "even" && winningNumber > 0 && winningNumber % 2 === 0) {
          multiplier = 1;
        } else if (bet.type === "odd" && winningNumber % 2 === 1) {
          multiplier = 1;
        } else if (bet.type === "low" && winningNumber >= 1 && winningNumber <= 18) {
          multiplier = 1;
        } else if (bet.type === "high" && winningNumber >= 19 && winningNumber <= 36) {
          multiplier = 1;
        }
        
        totalWin += bet.amount * multiplier;
      }
      
      // Update balance
      const newBalance = player.balance - totalBet + totalWin;
      await storage.updatePlayerBalance(player.telegramId, newBalance);
      
      // Add to history
      await storage.addGameHistory({
        playerId: player.id,
        gameType: "roulette",
        betAmount: totalBet,
        winAmount: totalWin,
        gameData: JSON.stringify({ winningNumber, bets })
      });
      
      res.json({
        winningNumber,
        totalWin,
        newBalance,
        isWin: totalWin > 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error spinning roulette:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Crypto deposit routes
  router.post("/crypto/deposit", async (req: Request, res: Response) => {
    try {
      const { playerId, cryptoCurrency, amount } = z.object({
        playerId: z.string(),
        cryptoCurrency: z.string(),
        amount: z.number().min(1)
      }).parse(req.body);
      
      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      // Get current crypto rates (mock rates for demo)
      const cryptoRates: { [key: string]: number } = {
        'BTC': 45000,
        'ETH': 2500,
        'USDT': 1,
        'TON': 2.5,
        'TRX': 0.08
      };
      
      const exchangeRate = cryptoRates[cryptoCurrency] || 1;
      const cryptoAmount = amount / exchangeRate;
      
      // Create transaction record
      const transaction = await storage.createCryptoTransaction({
        playerId: player.id,
        transactionType: "deposit",
        amount,
        cryptoCurrency,
        cryptoAmount,
        exchangeRate,
        status: "pending"
      });
      
      // Generate @send bot instructions
      const sendBotInstructions = {
        transactionId: transaction.id,
        cryptoCurrency,
        cryptoAmount: cryptoAmount.toFixed(8),
        instructions: `Для пополнения баланса в Golden Palace Casino отправьте ${cryptoAmount.toFixed(8)} ${cryptoCurrency} через @send бота с ID транзакции: ${transaction.id}`,
        sendBotCommand: `/send ${cryptoAmount.toFixed(8)} ${cryptoCurrency} @goldenpalace_casino_bot "deposit:${transaction.id}"`
      };
      
      res.json({
        transaction,
        sendBotInstructions
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating deposit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/crypto/confirm-deposit", async (req: Request, res: Response) => {
    try {
      const { transactionId, sendBotTransactionId } = z.object({
        transactionId: z.string(),
        sendBotTransactionId: z.string()
      }).parse(req.body);
      
      const transaction = await storage.getCryptoTransactionById(transactionId);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      if (transaction.status !== "pending") {
        return res.status(400).json({ error: "Transaction already processed" });
      }
      
      // Get player
      const player = await storage.getPlayer(transaction.playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      // Update transaction
      await storage.updateCryptoTransaction(transactionId, {
        status: "completed",
        sendBotTransactionId,
        completedAt: new Date()
      });
      
      // Update player balance
      const newBalance = player.balance + transaction.amount;
      await storage.updatePlayerBalance(player.telegramId, newBalance);
      
      res.json({
        success: true,
        newBalance,
        transaction
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error confirming deposit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/crypto/transactions/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const transactions = await storage.getCryptoTransactions(playerId);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting crypto transactions:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.post("/crypto/withdraw", async (req: Request, res: Response) => {
    try {
      const { playerId, amount, cryptoCurrency, walletAddress } = z.object({
        playerId: z.string(),
        amount: z.number().min(10), // Minimum withdrawal 10 USD
        cryptoCurrency: z.string(),
        walletAddress: z.string().min(10)
      }).parse(req.body);
      
      // Get player
      const player = await storage.getPlayer(playerId);
      if (!player) {
        return res.status(404).json({ error: "Player not found" });
      }
      
      if (player.balance < amount) {
        return res.status(400).json({ error: "Insufficient balance" });
      }
      
      // Create withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest({
        playerId: player.id,
        amount,
        cryptoCurrency,
        walletAddress,
        status: "pending"
      });
      
      // Deduct from balance immediately
      const newBalance = player.balance - amount;
      await storage.updatePlayerBalance(player.telegramId, newBalance);
      
      res.json({
        withdrawalRequest,
        newBalance,
        message: "Заявка на вывод создана. Обработка займет до 24 часов."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating withdrawal:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  router.get("/crypto/withdrawals/:playerId", async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const withdrawals = await storage.getWithdrawalRequests(playerId);
      res.json(withdrawals);
    } catch (error) {
      console.error("Error getting withdrawals:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

function isRedNumber(number: number): boolean {
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number);
}