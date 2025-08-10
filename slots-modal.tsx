import { useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useGameUtils } from "@/lib/game-utils";

interface SlotsModalProps {
  onClose: () => void;
}

export default function SlotsModal({ onClose }: SlotsModalProps) {
  const { player, updateBalance } = usePlayer();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { symbols } = useGameUtils();
  
  const [betAmount, setBetAmount] = useState(50);
  const [reels, setReels] = useState(['🍒', '🍋', '⭐']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const spinMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/slots/spin", {
        playerId: player?.id,
        betAmount
      });
      return response.json();
    },
    onSuccess: async (data) => {
      setReels(data.reels);
      setLastWin(data.winAmount);
      
      // Update balance
      const newBalance = (player?.balance || 0) - betAmount + data.winAmount;
      await updateBalance(newBalance);
      
      // Add to game history
      await apiRequest("POST", "/api/history", {
        playerId: player?.id,
        gameType: "slots",
        betAmount,
        winAmount: data.winAmount,
        gameData: JSON.stringify({ reels: data.reels, winMultiplier: data.winMultiplier })
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      
      if (data.winAmount > 0) {
        toast({
          title: "Поздравляем!",
          description: `Вы выиграли ${data.winAmount}₽!`,
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

  const handleSpin = async () => {
    if (!player || player.balance < betAmount) {
      toast({
        title: "Недостаточно средств",
        description: "Пополните баланс для продолжения игры",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      setIsSpinning(false);
      spinMutation.mutate();
    }, 1000);
  };

  const adjustBet = (change: number) => {
    const newBet = Math.max(10, Math.min(1000, betAmount + change));
    setBetAmount(newBet);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-primary">🎰 Слоты</h3>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <i className="fas fa-times text-foreground"></i>
            </button>
          </div>
          
          {/* Slot machine display */}
          <div className="bg-secondary rounded-xl p-6 mb-6">
            <div className="flex justify-center space-x-4 mb-6">
              {reels.map((symbol, index) => (
                <div
                  key={index}
                  className={`w-16 h-20 bg-card rounded-lg border-2 border-primary flex items-center justify-center text-3xl ${
                    isSpinning ? 'animate-slot-spin' : ''
                  }`}
                >
                  {symbol}
                </div>
              ))}
            </div>
            
            {/* Bet controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ставка:</span>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => adjustBet(-10)}
                    className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                    disabled={betAmount <= 10}
                  >
                    <i className="fas fa-minus text-xs"></i>
                  </button>
                  <span className="font-semibold w-16 text-center">{betAmount}₽</span>
                  <button 
                    onClick={() => adjustBet(10)}
                    className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
                    disabled={betAmount >= (player?.balance || 0) || betAmount >= 1000}
                  >
                    <i className="fas fa-plus text-xs"></i>
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleSpin}
                disabled={isSpinning || spinMutation.isPending || !player || player.balance < betAmount}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSpinning ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Крутим...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-2"></i>
                    Крутить
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Win display */}
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${lastWin > 0 ? 'text-success' : 'text-muted-foreground'}`}>
              {lastWin > 0 ? `+${lastWin}₽` : '0₽'}
            </div>
            <div className="text-sm text-muted-foreground">Последний выигрыш</div>
          </div>
        </div>
      </div>
    </div>
  );
}
