// Game utility functions and constants

export const useGameUtils = () => {
  // Slots symbols with their weights (lower weight = rarer)
  const symbols = [
    '🍒', // Cherry - most common
    '🍋', // Lemon - common
    '⭐', // Star - uncommon
    '🍎', // Apple - uncommon
    '🍇', // Grapes - rare
    '💎', // Diamond - very rare
    '🔔', // Bell - rare
  ];

  const symbolWeights = {
    '🍒': 100,
    '🍋': 80,
    '⭐': 60,
    '🍎': 60,
    '🍇': 40,
    '🔔': 30,
    '💎': 20,
  };

  const getWeightedSymbol = (): string => {
    const totalWeight = Object.values(symbolWeights).reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const [symbol, weight] of Object.entries(symbolWeights)) {
      currentWeight += weight;
      if (random <= currentWeight) {
        return symbol;
      }
    }
    
    return symbols[0]; // Fallback
  };

  const calculateSlotsWin = (reels: string[], betAmount: number): number => {
    // All three symbols match
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      const symbol = reels[0];
      switch (symbol) {
        case '💎': return betAmount * 10; // Diamond jackpot
        case '🔔': return betAmount * 8;  // Bell
        case '⭐': return betAmount * 6;  // Star
        case '🍇': return betAmount * 5;  // Grapes
        case '🍎': return betAmount * 4;  // Apple
        case '🍋': return betAmount * 3;  // Lemon
        case '🍒': return betAmount * 2;  // Cherry
        default: return betAmount * 2;
      }
    }
    
    // Two symbols match
    const symbolCounts = reels.reduce((acc: Record<string, number>, symbol) => {
      acc[symbol] = (acc[symbol] || 0) + 1;
      return acc;
    }, {});
    
    const maxCount = Math.max(...Object.values(symbolCounts));
    if (maxCount === 2) {
      return Math.floor(betAmount * 1.5); // 1.5x for two matching
    }
    
    return 0; // No win
  };

  // Blackjack utilities
  const createDeck = () => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({ rank, suit });
      }
    }
    
    return shuffleArray(deck);
  };

  const getCardValue = (card: { rank: string; suit: string }): number => {
    if (card.rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
  };

  const calculateHandValue = (cards: { rank: string; suit: string }[]): number => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      value += getCardValue(card);
      if (card.rank === 'A') aces++;
    }
    
    // Adjust for aces
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    return value;
  };

  // Roulette utilities
  const rouletteNumbers = Array.from({ length: 37 }, (_, i) => i); // 0-36
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  const calculateRoulettePayout = (bet: any, winningNumber: number): number => {
    const { type, value, amount } = bet;
    
    switch (type) {
      case 'number':
        return value === winningNumber ? amount * 35 : 0;
      
      case 'color':
        if (winningNumber === 0) return 0;
        const isRed = redNumbers.includes(winningNumber);
        const isBlack = blackNumbers.includes(winningNumber);
        
        if ((value === 'red' && isRed) || (value === 'black' && isBlack)) {
          return amount * 2;
        }
        return 0;
      
      case 'even':
        return winningNumber !== 0 && winningNumber % 2 === 0 ? amount * 2 : 0;
      
      case 'odd':
        return winningNumber !== 0 && winningNumber % 2 === 1 ? amount * 2 : 0;
      
      case 'low':
        return winningNumber >= 1 && winningNumber <= 18 ? amount * 2 : 0;
      
      case 'high':
        return winningNumber >= 19 && winningNumber <= 36 ? amount * 2 : 0;
      
      default:
        return 0;
    }
  };

  // Utility functions
  const shuffleArray = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const formatCurrency = (amount: number): string => {
    return '$' + amount.toLocaleString('en-US');
  };

  const formatTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const gameDate = new Date(date);
    const diffMs = now.getTime() - gameDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "только что";
    if (diffMins < 60) return `${diffMins} минут назад`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} часов назад`;
    return `${Math.floor(diffMins / 1440)} дней назад`;
  };

  // Mines game utilities
  const generateMineField = (gridSize: number, mineCount: number): number[] => {
    const mines: number[] = [];
    const totalCells = gridSize;
    
    while (mines.length < mineCount) {
      const position = getRandomNumber(0, totalCells - 1);
      if (!mines.includes(position)) {
        mines.push(position);
      }
    }
    
    return mines.sort((a, b) => a - b);
  };

  const calculateMinesMultiplier = (revealedCells: number, totalCells: number, mineCount: number): number => {
    const safeCells = totalCells - mineCount;
    const remainingSafeCells = safeCells - revealedCells;
    const remainingCells = totalCells - revealedCells;
    
    if (remainingSafeCells <= 0) return 1;
    
    // Progressive multiplier based on risk
    const riskFactor = (totalCells - remainingCells) / safeCells;
    return Math.max(1, 1 + (riskFactor * 2.5));
  };

  // Crash game utilities
  const generateCrashMultiplier = (): number => {
    // House edge of ~4%
    const random = Math.random();
    
    if (random < 0.04) return 1; // Instant crash 4% of the time
    if (random < 0.15) return 1 + Math.random() * 0.5; // Low multipliers
    if (random < 0.5) return 1.5 + Math.random() * 1; // Medium multipliers
    if (random < 0.85) return 2.5 + Math.random() * 5; // High multipliers
    
    // Very high multipliers (rare)
    return 7.5 + Math.random() * 15;
  };

  // Coin flip utilities
  const flipCoin = (): 'heads' | 'tails' => {
    return Math.random() < 0.5 ? 'heads' : 'tails';
  };

  // Penalty utilities
  const simulatePenalty = (shotDirection: 'left' | 'center' | 'right'): 'goal' | 'save' => {
    // Goalkeeper random choice
    const goalkeeperChoice: ('left' | 'center' | 'right') = 
      ['left', 'center', 'right'][getRandomNumber(0, 2)] as any;
    
    // If directions match, it's a save (70% of the time when they match)
    if (shotDirection === goalkeeperChoice) {
      return Math.random() < 0.7 ? 'save' : 'goal';
    }
    
    // If directions don't match, it's usually a goal (85% of the time)
    return Math.random() < 0.85 ? 'goal' : 'save';
  };

  return {
    symbols,
    symbolWeights,
    getWeightedSymbol,
    calculateSlotsWin,
    createDeck,
    getCardValue,
    calculateHandValue,
    rouletteNumbers,
    redNumbers,
    blackNumbers,
    calculateRoulettePayout,
    shuffleArray,
    getRandomNumber,
    formatCurrency,
    formatTimeAgo,
    // New game utilities
    generateMineField,
    calculateMinesMultiplier,
    generateCrashMultiplier,
    flipCoin,
    simulatePenalty,
  };
};
