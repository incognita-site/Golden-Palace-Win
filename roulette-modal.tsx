import { useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RouletteModalProps {
  onClose: () => void;
}

interface Bet {
  type: 'number' | 'color' | 'even' | 'odd' | 'low' | 'high';
  value: number | string;
  amount: number;
}

export default function RouletteModal({ onClose }: RouletteModalProps) {
  const { player, updateBalance } = usePlayer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [bets, setBets] = useState<Bet[]>([]);
  const [betAmount, setBetAmount] = useState(25);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [totalWin, setTotalWin] = useState(0);

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

  const numbers = Array.from({ length: 37 }, (_, i) => i);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/roulette/spin", {
        bets: bets.map(bet => JSON.stringify(bet))
      });
      return response.json();
    },
    onSuccess: async (data) => {
      setWinningNumber(data.winningNumber);
      setTotalWin(data.totalWin);
      
      // Update balance
      const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
      const newBalance = (player?.balance || 0) - totalBetAmount + data.totalWin;
      await updateBalance(newBalance);
      
      // Add to game history
      await apiRequest("POST", "/api/history", {
        playerId: player?.id,
        gameType: "roulette",
        betAmount: totalBetAmount,
        winAmount: data.totalWin,
        gameData: JSON.stringify({
          bets,
          winningNumber: data.winningNumber,
          totalWin: data.totalWin
        })
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      
      if (data.totalWin > 0) {
        toast({
          title: "Поздравляем!",
          description: `Выпало число ${data.winningNumber}! Вы выиграли ${data.totalWin}₽!`,
        });
      } else if (data.winningNumber === 0) {
        toast({
          title: "Зеро!",
          description: `Выпал зеро! Все ставки проиграли.`,
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось завершить игру",
        variant: "destructive",
      });
    }
  });

  const addBet = (type: Bet['type'], value: number | string) => {
    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    if (!player || (player.balance < totalBetAmount + betAmount)) {
      toast({
        title: "Недостаточно средств",
        description: "Пополните баланс для продолжения игры",
        variant: "destructive",
      });
      return;
    }

    const existingBetIndex = bets.findIndex(bet => bet.type === type && bet.value === value);
    
    if (existingBetIndex >= 0) {
      // Increase existing bet
      const newBets = [...bets];
      newBets[existingBetIndex].amount += betAmount;
      setBets(newBets);
    } else {
      // Add new bet
      setBets([...bets, { type, value, amount: betAmount }]);
    }
  };

  const clearBets = () => {
    setBets([]);
    setWinningNumber(null);
    setTotalWin(0);
  };

  const handleSpin = async () => {
    if (bets.length === 0) {
      toast({
        title: "Нет ставок",
        description: "Сделайте ставку перед запуском рулетки",
        variant: "destructive",
      });
      return;
    }

    const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
    
    if (!player || player.balance < totalBetAmount) {
      toast({
        title: "Недостаточно средств",
        description: "Пополните баланс для продолжения игры",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    
    setTimeout(() => {
      setIsSpinning(false);
      spinMutation.mutate();
    }, 3000);
  };

  const getTotalBet = () => {
    return bets.reduce((sum, bet) => sum + bet.amount, 0);
  };

  const getBetAmountForSpot = (type: Bet['type'], value: number | string) => {
    return bets
      .filter(bet => bet.type === type && bet.value === value)
      .reduce((sum, bet) => sum + bet.amount, 0);
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    if (redNumbers.includes(num)) return 'bg-red-600';
    return 'bg-black';
  };

  const getNumberTextColor = (num: number) => {
    if (num === 0) return 'text-white';
    if (redNumbers.includes(num)) return 'text-white';
    return 'text-white';
  };

  const adjustBetAmount = (change: number) => {
    const newAmount = Math.max(25, Math.min(500, betAmount + change));
    setBetAmount(newAmount);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary">🎯 Рулетка</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <i className="fas fa-times text-foreground"></i>
            </button>
          </div>
          
          {/* Roulette wheel */}
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className={`w-32 h-32 border-8 border-primary rounded-full flex items-center justify-center bg-gradient-to-r from-red-600 via-green-600 to-black ${
                isSpinning ? 'animate-roulette-spin' : ''
              }`}>
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary"></div>
              </div>
            </div>
            <div className="mt-4">
              {winningNumber !== null ? (
                <>
                  <div className={`text-2xl font-bold mb-2 ${
                    winningNumber === 0 ? 'text-success' :
                    redNumbers.includes(winningNumber) ? 'text-red-500' : 'text-white'
                  }`}>
                    {winningNumber}
                  </div>
                  <div className="text-sm text-muted-foreground">Выигрышное число</div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">?</div>
                  <div className="text-sm text-muted-foreground">Сделайте ставки</div>
                </>
              )}
            </div>
          </div>
          
          {/* Betting controls */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <span className="text-sm text-muted-foreground">Размер ставки:</span>
              <button 
                onClick={() => adjustBetAmount(-25)}
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                disabled={betAmount <= 25}
              >
                <i className="fas fa-minus text-xs"></i>
              </button>
              <span className="font-semibold w-16 text-center">{betAmount}₽</span>
              <button 
                onClick={() => adjustBetAmount(25)}
                className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                disabled={betAmount >= 500}
              >
                <i className="fas fa-plus text-xs"></i>
              </button>
            </div>
          </div>
          
          {/* Betting table */}
          <div className="bg-green-800 rounded-xl p-4 mb-6 text-white">
            {/* Zero */}
            <div className="mb-4">
              <button 
                onClick={() => addBet('number', 0)}
                className={`w-full py-3 rounded text-sm font-bold transition-colors ${
                  getBetAmountForSpot('number', 0) > 0 
                    ? 'bg-success hover:bg-success/80' 
                    : 'bg-green-600 hover:bg-green-500'
                }`}
              >
                <div>0 - ZERO</div>
                {getBetAmountForSpot('number', 0) > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('number', 0)}₽</div>
                )}
              </button>
            </div>
            
            {/* Numbers grid */}
            <div className="grid grid-cols-12 gap-1 mb-4">
              {numbers.slice(1).map((num) => (
                <button
                  key={num}
                  onClick={() => addBet('number', num)}
                  className={`aspect-square rounded text-xs font-bold flex flex-col items-center justify-center transition-colors ${
                    getBetAmountForSpot('number', num) > 0
                      ? 'ring-2 ring-primary'
                      : ''
                  } ${getNumberColor(num)} hover:opacity-80`}
                >
                  <div>{num}</div>
                  {getBetAmountForSpot('number', num) > 0 && (
                    <div className="text-xs">{getBetAmountForSpot('number', num)}₽</div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Outside bets */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <button 
                onClick={() => addBet('color', 'red')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('color', 'red') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-red-600 hover:bg-red-500`}
              >
                <div>Красное</div>
                {getBetAmountForSpot('color', 'red') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('color', 'red')}₽</div>
                )}
              </button>
              
              <button 
                onClick={() => addBet('color', 'black')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('color', 'black') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-black hover:bg-gray-800`}
              >
                <div>Черное</div>
                {getBetAmountForSpot('color', 'black') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('color', 'black')}₽</div>
                )}
              </button>
              
              <button 
                onClick={() => addBet('even', 'even')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('even', 'even') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-gray-700 hover:bg-gray-600`}
              >
                <div>Четное</div>
                {getBetAmountForSpot('even', 'even') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('even', 'even')}₽</div>
                )}
              </button>
              
              <button 
                onClick={() => addBet('odd', 'odd')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('odd', 'odd') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-gray-700 hover:bg-gray-600`}
              >
                <div>Нечетное</div>
                {getBetAmountForSpot('odd', 'odd') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('odd', 'odd')}₽</div>
                )}
              </button>
              
              <button 
                onClick={() => addBet('low', '1-18')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('low', '1-18') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-gray-700 hover:bg-gray-600`}
              >
                <div>1-18</div>
                {getBetAmountForSpot('low', '1-18') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('low', '1-18')}₽</div>
                )}
              </button>
              
              <button 
                onClick={() => addBet('high', '19-36')}
                className={`py-2 rounded text-sm font-semibold transition-colors ${
                  getBetAmountForSpot('high', '19-36') > 0 
                    ? 'ring-2 ring-primary' 
                    : ''
                } bg-gray-700 hover:bg-gray-600`}
              >
                <div>19-36</div>
                {getBetAmountForSpot('high', '19-36') > 0 && (
                  <div className="text-xs">{getBetAmountForSpot('high', '19-36')}₽</div>
                )}
              </button>
            </div>
          </div>
          
          {/* Game controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Общая ставка:</span>
              <span className="font-semibold">{getTotalBet()}₽</span>
            </div>
            
            {winningNumber !== null && (
              <div className="text-center p-4 bg-secondary rounded-lg">
                <div className={`text-2xl font-bold mb-2 ${totalWin > 0 ? 'text-success' : 'text-destructive'}`}>
                  {totalWin > 0 ? `Выигрыш: +${totalWin}₽` : 'Проигрыш'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Выпало число: {winningNumber}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button 
                onClick={clearBets}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-lg transition-colors"
              >
                Очистить
              </button>
              <button 
                onClick={handleSpin}
                disabled={isSpinning || spinMutation.isPending || bets.length === 0}
                className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Крутим...
                  </>
                ) : (
                  "Крутить"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
