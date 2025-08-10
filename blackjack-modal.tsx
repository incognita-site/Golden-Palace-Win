import { useState, useEffect } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface BlackjackModalProps {
  onClose: () => void;
}

interface Card {
  suit: string;
  rank: string;
  value: number;
}

export default function BlackjackModal({ onClose }: BlackjackModalProps) {
  const { player, updateBalance } = usePlayer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [betAmount, setBetAmount] = useState(100);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [playerScore, setPlayerScore] = useState(0);
  const [dealerScore, setDealerScore] = useState(0);
  const [gameResult, setGameResult] = useState<string>('');
  const [winAmount, setWinAmount] = useState(0);

  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const createCard = (rank: string, suit: string): Card => {
    let value = 0;
    if (rank === 'A') value = 11;
    else if (['J', 'Q', 'K'].includes(rank)) value = 10;
    else value = parseInt(rank);
    
    return { rank, suit, value };
  };

  const getRandomCard = (): Card => {
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    return createCard(rank, suit);
  };

  const calculateScore = (cards: Card[]): number => {
    let score = 0;
    let aces = 0;
    
    cards.forEach(card => {
      score += card.value;
      if (card.rank === 'A') aces++;
    });
    
    // Adjust for aces
    while (score > 21 && aces > 0) {
      score -= 10;
      aces--;
    }
    
    return score;
  };

  const hitMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/blackjack/hit", {
        playerId: player?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      const cardParts = data.card.match(/^(.+)(.)$/);
      if (cardParts) {
        const rank = cardParts[1];
        const suit = cardParts[2];
        const newCard = createCard(rank, suit);
        const newPlayerCards = [...playerCards, newCard];
        setPlayerCards(newPlayerCards);
        
        const newScore = calculateScore(newPlayerCards);
        setPlayerScore(newScore);
        
        if (newScore > 21) {
          // Bust
          endGame('dealer_wins', 0);
        }
      }
    }
  });

  const startGame = () => {
    if (!player || player.balance < betAmount) {
      toast({
        title: "Недостаточно средств",
        description: "Пополните баланс для продолжения игры",
        variant: "destructive",
      });
      return;
    }

    // Deal initial cards
    const playerInitialCards = [getRandomCard(), getRandomCard()];
    const dealerInitialCards = [getRandomCard(), getRandomCard()];
    
    setPlayerCards(playerInitialCards);
    setDealerCards([dealerInitialCards[0]]); // Show only one dealer card
    
    const playerInitialScore = calculateScore(playerInitialCards);
    const dealerInitialScore = calculateScore(dealerInitialCards);
    
    setPlayerScore(playerInitialScore);
    setDealerScore(dealerInitialCards[0].value); // Show only first card score
    
    // Check for blackjack
    if (playerInitialScore === 21) {
      setDealerCards(dealerInitialCards);
      setDealerScore(dealerInitialScore);
      if (dealerInitialScore === 21) {
        endGame('tie', betAmount);
      } else {
        endGame('blackjack', Math.floor(betAmount * 2.5));
      }
    } else {
      setGameState('playing');
    }
  };

  const stand = () => {
    // Reveal dealer's hidden card and play dealer's turn
    let currentDealerCards = [...dealerCards];
    if (currentDealerCards.length === 1) {
      currentDealerCards.push(getRandomCard());
    }
    
    // Dealer hits until 17 or higher
    while (calculateScore(currentDealerCards) < 17) {
      currentDealerCards.push(getRandomCard());
    }
    
    setDealerCards(currentDealerCards);
    const finalDealerScore = calculateScore(currentDealerCards);
    setDealerScore(finalDealerScore);
    
    // Determine winner
    if (finalDealerScore > 21) {
      endGame('player_wins', betAmount * 2);
    } else if (finalDealerScore > playerScore) {
      endGame('dealer_wins', 0);
    } else if (finalDealerScore < playerScore) {
      endGame('player_wins', betAmount * 2);
    } else {
      endGame('tie', betAmount);
    }
  };

  const endGame = async (result: string, winnings: number) => {
    setGameResult(result);
    setWinAmount(winnings);
    setGameState('finished');
    
    // Update balance
    const newBalance = (player?.balance || 0) - betAmount + winnings;
    await updateBalance(newBalance);
    
    // Add to game history
    await apiRequest("POST", "/api/history", {
      playerId: player?.id,
      gameType: "blackjack",
      betAmount,
      winAmount: winnings,
      gameData: JSON.stringify({
        playerCards: playerCards.map(c => c.rank + c.suit),
        dealerCards: dealerCards.map(c => c.rank + c.suit),
        playerScore,
        dealerScore: calculateScore(dealerCards),
        result
      })
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    
    if (winnings > 0) {
      toast({
        title: result === 'blackjack' ? "Блэкджек!" : "Поздравляем!",
        description: `Вы выиграли ${winnings}₽!`,
      });
    }
  };

  const newGame = () => {
    setGameState('betting');
    setPlayerCards([]);
    setDealerCards([]);
    setPlayerScore(0);
    setDealerScore(0);
    setGameResult('');
    setWinAmount(0);
  };

  const adjustBet = (change: number) => {
    const newBet = Math.max(50, Math.min(1000, betAmount + change));
    setBetAmount(newBet);
  };

  const getResultText = () => {
    switch (gameResult) {
      case 'blackjack': return 'Блэкджек!';
      case 'player_wins': return 'Вы выиграли!';
      case 'dealer_wins': return 'Дилер выиграл';
      case 'tie': return 'Ничья';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary">🃏 Блэкджек</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <i className="fas fa-times text-foreground"></i>
            </button>
          </div>
          
          {gameState === 'betting' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold mb-4">Сделайте ставку</h4>
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <button 
                    onClick={() => adjustBet(-50)}
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                    disabled={betAmount <= 50}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="text-2xl font-bold text-primary w-24 text-center">{betAmount}₽</span>
                  <button 
                    onClick={() => adjustBet(50)}
                    className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                    disabled={betAmount >= (player?.balance || 0) || betAmount >= 1000}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <button 
                  onClick={startGame}
                  disabled={!player || player.balance < betAmount}
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Играть
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Game table */}
              <div className="bg-gradient-to-b from-green-800 to-green-900 rounded-xl p-6 mb-6 text-white">
                {/* Dealer cards */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Дилер</span>
                    <span className="font-semibold">{dealerScore}</span>
                  </div>
                  <div className="flex space-x-2">
                    {dealerCards.map((card, index) => (
                      <div 
                        key={index}
                        className="w-12 h-16 bg-white rounded border text-black flex items-center justify-center text-xs font-bold animate-card-flip"
                        style={{ 
                          color: ['♥', '♦'].includes(card.suit) ? '#dc2626' : '#000000' 
                        }}
                      >
                        {card.rank}{card.suit}
                      </div>
                    ))}
                    {gameState === 'playing' && dealerCards.length === 1 && (
                      <div className="w-12 h-16 bg-blue-800 rounded border flex items-center justify-center text-xs">
                        ?
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Player cards */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Вы</span>
                    <span className="font-semibold">{playerScore}</span>
                  </div>
                  <div className="flex space-x-2">
                    {playerCards.map((card, index) => (
                      <div 
                        key={index}
                        className="w-12 h-16 bg-white rounded border flex items-center justify-center text-xs font-bold"
                        style={{ 
                          color: ['♥', '♦'].includes(card.suit) ? '#dc2626' : '#000000' 
                        }}
                      >
                        {card.rank}{card.suit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Game controls */}
              <div className="space-y-4">
                {gameState === 'finished' && (
                  <div className="text-center mb-4">
                    <div className={`text-2xl font-bold mb-2 ${winAmount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {getResultText()}
                    </div>
                    <div className={`text-xl font-semibold ${winAmount > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                      {winAmount > 0 ? `+${winAmount}₽` : `${-betAmount}₽`}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Ставка:</span>
                  <span className="font-semibold">{betAmount}₽</span>
                </div>
                
                {gameState === 'playing' && (
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => hitMutation.mutate()}
                      disabled={hitMutation.isPending}
                      className="bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {hitMutation.isPending ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Берем...
                        </>
                      ) : (
                        "Взять карту"
                      )}
                    </button>
                    <button 
                      onClick={stand}
                      className="bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-lg transition-colors"
                    >
                      Стоп
                    </button>
                  </div>
                )}
                
                {gameState === 'finished' && (
                  <button 
                    onClick={newGame}
                    className="w-full bg-success hover:bg-success/80 text-success-foreground font-semibold py-3 rounded-lg transition-colors"
                  >
                    Новая игра
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
