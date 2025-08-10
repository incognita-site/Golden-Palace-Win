import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPlayerSchema, 
  insertGameHistorySchema, 
  insertSlotsStateSchema,
  insertBlackjackStateSchema,
  insertRouletteStateSchema,
  insertMinesStateSchema,
  insertCrashStateSchema,
  insertCoinflipStateSchema,
  insertPenaltyStateSchema,
  insertCryptoTransactionSchema,
  insertWithdrawalRequestSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Player routes
  app.get("/api/player/:telegramId", async (req, res) => {
    try {
      const { telegramId } = req.params;
      const player = await storage.getPlayer(telegramId);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/player", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const existingPlayer = await storage.getPlayer(playerData.telegramId);
      if (existingPlayer) {
        return res.json(existingPlayer);
      }
      const player = await storage.createPlayer(playerData);
      res.status(201).json(player);
    } catch (error) {
      res.status(400).json({ message: "Invalid player data" });
    }
  });

  app.patch("/api/player/:telegramId/balance", async (req, res) => {
    try {
      const { telegramId } = req.params;
      const { balance } = req.body;
      await storage.updatePlayerBalance(telegramId, balance);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Game history routes
  app.get("/api/history/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const history = await storage.getGameHistory(playerId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get game history" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const historyData = insertGameHistorySchema.parse(req.body);
      const history = await storage.addGameHistory(historyData);
      res.status(201).json(history);
    } catch (error) {
      res.status(400).json({ message: "Invalid history data" });
    }
  });

  // Slots routes
  app.get("/api/slots/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getSlotsState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get slots state" });
    }
  });

  app.post("/api/slots", async (req, res) => {
    try {
      const stateData = insertSlotsStateSchema.parse(req.body);
      const state = await storage.createSlotsState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid slots data" });
    }
  });

  app.patch("/api/slots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateSlotsState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update slots state" });
    }
  });

  app.delete("/api/slots/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSlotsState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete slots state" });
    }
  });

  // Blackjack routes
  app.get("/api/blackjack/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getBlackjackState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blackjack state" });
    }
  });

  app.post("/api/blackjack", async (req, res) => {
    try {
      const stateData = insertBlackjackStateSchema.parse(req.body);
      const state = await storage.createBlackjackState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid blackjack data" });
    }
  });

  app.patch("/api/blackjack/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateBlackjackState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update blackjack state" });
    }
  });

  app.delete("/api/blackjack/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlackjackState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blackjack state" });
    }
  });

  // Roulette routes
  app.get("/api/roulette/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getRouletteState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get roulette state" });
    }
  });

  app.post("/api/roulette", async (req, res) => {
    try {
      const stateData = insertRouletteStateSchema.parse(req.body);
      const state = await storage.createRouletteState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid roulette data" });
    }
  });

  app.patch("/api/roulette/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateRouletteState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update roulette state" });
    }
  });

  app.delete("/api/roulette/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteRouletteState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete roulette state" });
    }
  });

  // Mines game routes
  app.get("/api/mines/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getMinesState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get mines state" });
    }
  });

  app.post("/api/mines", async (req, res) => {
    try {
      const stateData = insertMinesStateSchema.parse(req.body);
      const state = await storage.createMinesState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid mines data" });
    }
  });

  app.patch("/api/mines/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateMinesState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update mines state" });
    }
  });

  app.delete("/api/mines/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteMinesState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete mines state" });
    }
  });

  // Crash game routes
  app.get("/api/crash/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getCrashState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get crash state" });
    }
  });

  app.post("/api/crash", async (req, res) => {
    try {
      const stateData = insertCrashStateSchema.parse(req.body);
      const state = await storage.createCrashState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid crash data" });
    }
  });

  app.patch("/api/crash/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateCrashState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update crash state" });
    }
  });

  app.delete("/api/crash/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCrashState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crash state" });
    }
  });

  // Coinflip game routes
  app.get("/api/coinflip/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getCoinflipState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get coinflip state" });
    }
  });

  app.post("/api/coinflip", async (req, res) => {
    try {
      const stateData = insertCoinflipStateSchema.parse(req.body);
      const state = await storage.createCoinflipState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid coinflip data" });
    }
  });

  app.patch("/api/coinflip/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateCoinflipState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update coinflip state" });
    }
  });

  app.delete("/api/coinflip/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteCoinflipState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete coinflip state" });
    }
  });

  // Penalty game routes
  app.get("/api/penalty/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const state = await storage.getPenaltyState(playerId);
      res.json(state);
    } catch (error) {
      res.status(500).json({ message: "Failed to get penalty state" });
    }
  });

  app.post("/api/penalty", async (req, res) => {
    try {
      const stateData = insertPenaltyStateSchema.parse(req.body);
      const state = await storage.createPenaltyState(stateData);
      res.status(201).json(state);
    } catch (error) {
      res.status(400).json({ message: "Invalid penalty data" });
    }
  });

  app.patch("/api/penalty/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updatePenaltyState(id, req.body);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update penalty state" });
    }
  });

  app.delete("/api/penalty/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePenaltyState(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete penalty state" });
    }
  });

  // Crypto transaction routes
  app.get("/api/transactions/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const transactions = await storage.getCryptoTransactions(playerId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertCryptoTransactionSchema.parse(req.body);
      const transaction = await storage.createCryptoTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  // Withdrawal request routes
  app.get("/api/withdrawals/:playerId", async (req, res) => {
    try {
      const { playerId } = req.params;
      const requests = await storage.getWithdrawalRequests(playerId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawal requests" });
    }
  });

  app.post("/api/withdrawals", async (req, res) => {
    try {
      const requestData = insertWithdrawalRequestSchema.parse(req.body);
      const request = await storage.createWithdrawalRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid withdrawal request data" });
    }
  });

  // Game action routes
  app.post("/api/slots/spin", async (req, res) => {
    try {
      const { playerId, betAmount } = req.body;
      
      // Generate random slots result
      const symbols = ['🍒', '🍋', '⭐', '🍎', '🍇', '💎', '🔔'];
      const reels = [
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ];

      // Calculate win
      let winMultiplier = 0;
      if (reels[0] === reels[1] && reels[1] === reels[2]) {
        winMultiplier = reels[0] === '💎' ? 10 : reels[0] === '⭐' ? 5 : 3;
      } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
        winMultiplier = 1.5;
      }

      const winAmount = Math.floor(betAmount * winMultiplier);

      res.json({
        reels,
        winAmount,
        winMultiplier
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to spin slots" });
    }
  });

  app.post("/api/blackjack/hit", async (req, res) => {
    try {
      const { playerId } = req.body;
      
      // Generate random card
      const suits = ['♠', '♥', '♦', '♣'];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      const suit = suits[Math.floor(Math.random() * suits.length)];
      const rank = ranks[Math.floor(Math.random() * ranks.length)];
      const card = rank + suit;

      res.json({ card });
    } catch (error) {
      res.status(500).json({ message: "Failed to hit card" });
    }
  });

  app.post("/api/roulette/spin", async (req, res) => {
    try {
      const { bets } = req.body;
      
      // Generate random winning number (0-36)
      const winningNumber = Math.floor(Math.random() * 37);
      
      // Calculate total win based on bets
      let totalWin = 0;
      bets.forEach((bet: any) => {
        const parsedBet = JSON.parse(bet);
        if (parsedBet.type === 'number' && parsedBet.value === winningNumber) {
          totalWin += parsedBet.amount * 35;
        } else if (parsedBet.type === 'color') {
          const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(winningNumber);
          if ((parsedBet.value === 'red' && isRed) || (parsedBet.value === 'black' && !isRed && winningNumber !== 0)) {
            totalWin += parsedBet.amount * 2;
          }
        }
      });

      res.json({
        winningNumber,
        totalWin
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to spin roulette" });
    }
  });

  // New game action routes
  app.post("/api/mines/reveal", async (req, res) => {
    try {
      const { playerId, cellIndex, minePositions } = req.body;
      
      const isMine = minePositions.includes(cellIndex);
      
      res.json({
        isMine,
        cellIndex
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reveal mine cell" });
    }
  });

  app.post("/api/crash/start", async (req, res) => {
    try {
      const crashMultiplier = 1 + Math.random() * 19; // 1x to 20x crash point
      
      res.json({
        crashMultiplier: parseFloat(crashMultiplier.toFixed(2))
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to start crash game" });
    }
  });

  app.post("/api/coinflip/flip", async (req, res) => {
    try {
      const { playerChoice } = req.body;
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      const isWin = playerChoice === result;
      
      res.json({
        result,
        isWin,
        winAmount: isWin ? req.body.betAmount * 2 : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to flip coin" });
    }
  });

  app.post("/api/penalty/shoot", async (req, res) => {
    try {
      const { shotDirection } = req.body;
      const goalkeeperSave = ['left', 'center', 'right'][Math.floor(Math.random() * 3)];
      
      // Goal probability logic
      let isGoal = true;
      if (shotDirection === goalkeeperSave) {
        isGoal = Math.random() < 0.3; // 30% chance to score even if keeper guesses right
      } else {
        isGoal = Math.random() < 0.85; // 85% chance to score if keeper guesses wrong
      }
      
      res.json({
        goalkeeperSave,
        isGoal,
        winAmount: isGoal ? req.body.betAmount * 2 : 0
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to shoot penalty" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
