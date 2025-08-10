import { z } from "zod";

// Player data types
export const playerSchema = z.object({
  id: z.string(),
  telegramId: z.string(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  balance: z.number().default(1000),
  createdAt: z.date().default(() => new Date()),
});

// Game history types
export const gameHistorySchema = z.object({
  id: z.string(),
  playerId: z.string(),
  gameType: z.enum(["slots", "blackjack", "roulette"]),
  betAmount: z.number(),
  winAmount: z.number().default(0),
  gameData: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
});

// Slots game state
export const slotsStateSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  reels: z.array(z.string()),
  betAmount: z.number(),
  winAmount: z.number().default(0),
  isActive: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Blackjack game state
export const blackjackStateSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  playerCards: z.array(z.string()),
  dealerCards: z.array(z.string()),
  betAmount: z.number(),
  gameStatus: z.enum(["active", "player_wins", "dealer_wins", "tie", "blackjack", "bust"]),
  playerScore: z.number().default(0),
  dealerScore: z.number().default(0),
  isActive: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Roulette game state
export const rouletteStateSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  bets: z.array(z.string()), // JSON strings of bet objects
  winningNumber: z.number().optional(),
  totalBet: z.number(),
  totalWin: z.number().default(0),
  isActive: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
});

// Insert schemas (without id and createdAt)
export const insertPlayerSchema = playerSchema.omit({
  id: true,
  createdAt: true,
});

export const insertGameHistorySchema = gameHistorySchema.omit({
  id: true,
  createdAt: true,
});

export const insertSlotsStateSchema = slotsStateSchema.omit({
  id: true,
  createdAt: true,
});

export const insertBlackjackStateSchema = blackjackStateSchema.omit({
  id: true,
  createdAt: true,
});

export const insertRouletteStateSchema = rouletteStateSchema.omit({
  id: true,
  createdAt: true,
});

// Types
export type Player = z.infer<typeof playerSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;

export type GameHistory = z.infer<typeof gameHistorySchema>;
export type InsertGameHistory = z.infer<typeof insertGameHistorySchema>;

export type SlotsState = z.infer<typeof slotsStateSchema>;
export type InsertSlotsState = z.infer<typeof insertSlotsStateSchema>;

export type BlackjackState = z.infer<typeof blackjackStateSchema>;
export type InsertBlackjackState = z.infer<typeof insertBlackjackStateSchema>;

export type RouletteState = z.infer<typeof rouletteStateSchema>;
export type InsertRouletteState = z.infer<typeof insertRouletteStateSchema>;

// Crypto transactions schema
export const cryptoTransactionSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  transactionType: z.enum(["deposit", "withdrawal"]),
  amount: z.number(),
  cryptoCurrency: z.string(), // BTC, ETH, USDT, etc.
  cryptoAmount: z.number(),
  exchangeRate: z.number(),
  sendBotTransactionId: z.string().optional(),
  walletAddress: z.string().optional(),
  status: z.enum(["pending", "completed", "failed", "cancelled"]),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional(),
});

// Withdrawal requests schema
export const withdrawalRequestSchema = z.object({
  id: z.string(),
  playerId: z.string(),
  amount: z.number(),
  cryptoCurrency: z.string(),
  walletAddress: z.string(),
  status: z.enum(["pending", "approved", "rejected", "completed"]),
  createdAt: z.date().default(() => new Date()),
  processedAt: z.date().optional(),
});

// Insert schemas for crypto features
export const insertCryptoTransactionSchema = cryptoTransactionSchema.omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = withdrawalRequestSchema.omit({
  id: true,
  createdAt: true,
});

// Types for crypto features
export type CryptoTransaction = z.infer<typeof cryptoTransactionSchema>;
export type InsertCryptoTransaction = z.infer<typeof insertCryptoTransactionSchema>;

export type WithdrawalRequest = z.infer<typeof withdrawalRequestSchema>;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;