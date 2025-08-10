import { 
  Player, InsertPlayer, 
  GameHistory, InsertGameHistory,
  SlotsState, InsertSlotsState,
  BlackjackState, InsertBlackjackState,
  RouletteState, InsertRouletteState,
  MinesState, InsertMinesState,
  CrashState, InsertCrashState,
  CoinflipState, InsertCoinflipState,
  PenaltyState, InsertPenaltyState,
  CryptoTransaction, InsertCryptoTransaction,
  WithdrawalRequest, InsertWithdrawalRequest
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Player operations
  getPlayer(telegramId: string): Promise<Player | null>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayerBalance(telegramId: string, newBalance: number): Promise<void>;
  
  // Game history operations  
  getGameHistory(playerId: string): Promise<GameHistory[]>;
  addGameHistory(history: InsertGameHistory): Promise<GameHistory>;
  
  // Slots operations
  getSlotsState(playerId: string): Promise<SlotsState | null>;
  createSlotsState(state: InsertSlotsState): Promise<SlotsState>;
  updateSlotsState(id: string, state: Partial<SlotsState>): Promise<void>;
  deleteSlotsState(id: string): Promise<void>;
  
  // Blackjack operations
  getBlackjackState(playerId: string): Promise<BlackjackState | null>;
  createBlackjackState(state: InsertBlackjackState): Promise<BlackjackState>;
  updateBlackjackState(id: string, state: Partial<BlackjackState>): Promise<void>;
  deleteBlackjackState(id: string): Promise<void>;
  
  // Roulette operations
  getRouletteState(playerId: string): Promise<RouletteState | null>;
  createRouletteState(state: InsertRouletteState): Promise<RouletteState>;
  updateRouletteState(id: string, state: Partial<RouletteState>): Promise<void>;
  deleteRouletteState(id: string): Promise<void>;
  
  // Mines operations
  getMinesState(playerId: string): Promise<MinesState | null>;
  createMinesState(state: InsertMinesState): Promise<MinesState>;
  updateMinesState(id: string, state: Partial<MinesState>): Promise<void>;
  deleteMinesState(id: string): Promise<void>;
  
  // Crash operations
  getCrashState(playerId: string): Promise<CrashState | null>;
  createCrashState(state: InsertCrashState): Promise<CrashState>;
  updateCrashState(id: string, state: Partial<CrashState>): Promise<void>;
  deleteCrashState(id: string): Promise<void>;
  
  // Coinflip operations
  getCoinflipState(playerId: string): Promise<CoinflipState | null>;
  createCoinflipState(state: InsertCoinflipState): Promise<CoinflipState>;
  updateCoinflipState(id: string, state: Partial<CoinflipState>): Promise<void>;
  deleteCoinflipState(id: string): Promise<void>;
  
  // Penalty operations
  getPenaltyState(playerId: string): Promise<PenaltyState | null>;
  createPenaltyState(state: InsertPenaltyState): Promise<PenaltyState>;
  updatePenaltyState(id: string, state: Partial<PenaltyState>): Promise<void>;
  deletePenaltyState(id: string): Promise<void>;
  
  // Crypto transaction operations
  getCryptoTransactions(playerId: string): Promise<CryptoTransaction[]>;
  createCryptoTransaction(transaction: InsertCryptoTransaction): Promise<CryptoTransaction>;
  updateCryptoTransaction(id: string, transaction: Partial<CryptoTransaction>): Promise<void>;
  getCryptoTransactionById(id: string): Promise<CryptoTransaction | null>;
  
  // Withdrawal request operations
  getWithdrawalRequests(playerId: string): Promise<WithdrawalRequest[]>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  updateWithdrawalRequest(id: string, request: Partial<WithdrawalRequest>): Promise<void>;
  getWithdrawalRequestById(id: string): Promise<WithdrawalRequest | null>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player> = new Map();
  private gameHistory: Map<string, GameHistory> = new Map();
  private slotsStates: Map<string, SlotsState> = new Map();
  private blackjackStates: Map<string, BlackjackState> = new Map();
  private rouletteStates: Map<string, RouletteState> = new Map();
  private minesStates: Map<string, MinesState> = new Map();
  private crashStates: Map<string, CrashState> = new Map();
  private coinflipStates: Map<string, CoinflipState> = new Map();
  private penaltyStates: Map<string, PenaltyState> = new Map();
  private cryptoTransactions: Map<string, CryptoTransaction> = new Map();
  private withdrawalRequests: Map<string, WithdrawalRequest> = new Map();

  // Player operations
  async getPlayer(telegramId: string): Promise<Player | null> {
    for (const player of this.players.values()) {
      if (player.telegramId === telegramId) {
        return player;
      }
    }
    return null;
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const player: Player = {
      ...playerData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.players.set(player.id, player);
    return player;
  }

  async updatePlayerBalance(telegramId: string, newBalance: number): Promise<void> {
    const player = await this.getPlayer(telegramId);
    if (player) {
      player.balance = newBalance;
      this.players.set(player.id, player);
    }
  }

  // Game history operations
  async getGameHistory(playerId: string): Promise<GameHistory[]> {
    const history: GameHistory[] = [];
    for (const record of this.gameHistory.values()) {
      if (record.playerId === playerId) {
        history.push(record);
      }
    }
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async addGameHistory(historyData: InsertGameHistory): Promise<GameHistory> {
    const history: GameHistory = {
      ...historyData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.gameHistory.set(history.id, history);
    return history;
  }

  // Slots operations
  async getSlotsState(playerId: string): Promise<SlotsState | null> {
    for (const state of this.slotsStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createSlotsState(stateData: InsertSlotsState): Promise<SlotsState> {
    const state: SlotsState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.slotsStates.set(state.id, state);
    return state;
  }

  async updateSlotsState(id: string, stateData: Partial<SlotsState>): Promise<void> {
    const state = this.slotsStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.slotsStates.set(id, state);
    }
  }

  async deleteSlotsState(id: string): Promise<void> {
    this.slotsStates.delete(id);
  }

  // Blackjack operations
  async getBlackjackState(playerId: string): Promise<BlackjackState | null> {
    for (const state of this.blackjackStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createBlackjackState(stateData: InsertBlackjackState): Promise<BlackjackState> {
    const state: BlackjackState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.blackjackStates.set(state.id, state);
    return state;
  }

  async updateBlackjackState(id: string, stateData: Partial<BlackjackState>): Promise<void> {
    const state = this.blackjackStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.blackjackStates.set(id, state);
    }
  }

  async deleteBlackjackState(id: string): Promise<void> {
    this.blackjackStates.delete(id);
  }

  // Roulette operations
  async getRouletteState(playerId: string): Promise<RouletteState | null> {
    for (const state of this.rouletteStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createRouletteState(stateData: InsertRouletteState): Promise<RouletteState> {
    const state: RouletteState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.rouletteStates.set(state.id, state);
    return state;
  }

  async updateRouletteState(id: string, stateData: Partial<RouletteState>): Promise<void> {
    const state = this.rouletteStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.rouletteStates.set(id, state);
    }
  }

  async deleteRouletteState(id: string): Promise<void> {
    this.rouletteStates.delete(id);
  }

  // Mines operations
  async getMinesState(playerId: string): Promise<MinesState | null> {
    for (const state of this.minesStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createMinesState(stateData: InsertMinesState): Promise<MinesState> {
    const state: MinesState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.minesStates.set(state.id, state);
    return state;
  }

  async updateMinesState(id: string, stateData: Partial<MinesState>): Promise<void> {
    const state = this.minesStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.minesStates.set(id, state);
    }
  }

  async deleteMinesState(id: string): Promise<void> {
    this.minesStates.delete(id);
  }

  // Crash operations
  async getCrashState(playerId: string): Promise<CrashState | null> {
    for (const state of this.crashStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createCrashState(stateData: InsertCrashState): Promise<CrashState> {
    const state: CrashState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.crashStates.set(state.id, state);
    return state;
  }

  async updateCrashState(id: string, stateData: Partial<CrashState>): Promise<void> {
    const state = this.crashStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.crashStates.set(id, state);
    }
  }

  async deleteCrashState(id: string): Promise<void> {
    this.crashStates.delete(id);
  }

  // Coinflip operations
  async getCoinflipState(playerId: string): Promise<CoinflipState | null> {
    for (const state of this.coinflipStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createCoinflipState(stateData: InsertCoinflipState): Promise<CoinflipState> {
    const state: CoinflipState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.coinflipStates.set(state.id, state);
    return state;
  }

  async updateCoinflipState(id: string, stateData: Partial<CoinflipState>): Promise<void> {
    const state = this.coinflipStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.coinflipStates.set(id, state);
    }
  }

  async deleteCoinflipState(id: string): Promise<void> {
    this.coinflipStates.delete(id);
  }

  // Penalty operations
  async getPenaltyState(playerId: string): Promise<PenaltyState | null> {
    for (const state of this.penaltyStates.values()) {
      if (state.playerId === playerId && state.isActive) {
        return state;
      }
    }
    return null;
  }

  async createPenaltyState(stateData: InsertPenaltyState): Promise<PenaltyState> {
    const state: PenaltyState = {
      ...stateData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.penaltyStates.set(state.id, state);
    return state;
  }

  async updatePenaltyState(id: string, stateData: Partial<PenaltyState>): Promise<void> {
    const state = this.penaltyStates.get(id);
    if (state) {
      Object.assign(state, stateData);
      this.penaltyStates.set(id, state);
    }
  }

  async deletePenaltyState(id: string): Promise<void> {
    this.penaltyStates.delete(id);
  }

  // Crypto transaction operations
  async getCryptoTransactions(playerId: string): Promise<CryptoTransaction[]> {
    const transactions: CryptoTransaction[] = [];
    for (const transaction of this.cryptoTransactions.values()) {
      if (transaction.playerId === playerId) {
        transactions.push(transaction);
      }
    }
    return transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createCryptoTransaction(transactionData: InsertCryptoTransaction): Promise<CryptoTransaction> {
    const transaction: CryptoTransaction = {
      ...transactionData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.cryptoTransactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateCryptoTransaction(id: string, transactionData: Partial<CryptoTransaction>): Promise<void> {
    const transaction = this.cryptoTransactions.get(id);
    if (transaction) {
      Object.assign(transaction, transactionData);
      this.cryptoTransactions.set(id, transaction);
    }
  }

  async getCryptoTransactionById(id: string): Promise<CryptoTransaction | null> {
    return this.cryptoTransactions.get(id) || null;
  }

  // Withdrawal request operations
  async getWithdrawalRequests(playerId: string): Promise<WithdrawalRequest[]> {
    const requests: WithdrawalRequest[] = [];
    for (const request of this.withdrawalRequests.values()) {
      if (request.playerId === playerId) {
        requests.push(request);
      }
    }
    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createWithdrawalRequest(requestData: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const request: WithdrawalRequest = {
      ...requestData,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.withdrawalRequests.set(request.id, request);
    return request;
  }

  async updateWithdrawalRequest(id: string, requestData: Partial<WithdrawalRequest>): Promise<void> {
    const request = this.withdrawalRequests.get(id);
    if (request) {
      Object.assign(request, requestData);
      this.withdrawalRequests.set(id, request);
    }
  }

  async getWithdrawalRequestById(id: string): Promise<WithdrawalRequest | null> {
    return this.withdrawalRequests.get(id) || null;
  }
}

export const storage = new MemStorage();
