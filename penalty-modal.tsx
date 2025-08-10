import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameUtils } from "@/lib/game-utils";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PenaltyModalProps {
  onClose: () => void;
}

type Direction = 'left' | 'center' | 'right';

export default function PenaltyModal({ onClose }: PenaltyModalProps) {
  const [betAmount, setBetAmount] = useState<number>(30);
  const [shotDirection, setShotDirection] = useState<Direction>('center');
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [goalkeeperSave, setGoalkeeperSave] = useState<Direction | null>(null);
  const [gameResult, setGameResult] = useState<'goal' | 'save' | null>(null);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [showAnimation, setShowAnimation] = useState<boolean>(false);
  
  const { formatCurrency } = useGameUtils();
  const { player, updateBalance } = usePlayer();
  const queryClient = useQueryClient();

  const shootMutation = useMutation({
    mutationFn: async () => {
      if (!player || player.balance < betAmount) {
        throw new Error("Недостаточно средств");
      }

      setGameActive(true);
      setShowAnimation(true);
      setGoalkeeperSave(null);
      setGameResult(null);

      // Deduct bet amount
      await updateBalance(player.balance - betAmount);

      // Create game state
      await apiRequest('/api/penalty', {
        method: 'POST',
        body: {
          playerId: player.id,
          betAmount,
          shotDirection,
          gameStatus: 'active',
          isActive: true
        }
      });

      // Simulate penalty delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get penalty result from server
      const response = await apiRequest('/api/penalty/shoot', {
        method: 'POST',
        body: {
          shotDirection,
          betAmount
        }
      });

      setGoalkeeperSave(response.goalkeeperSave);
      setShowAnimation(false);
      
      if (response.isGoal) {
        setGameResult('goal');
        setWinAmount(response.winAmount);
        
        // Add winnings to balance
        await updateBalance(player.balance + response.winAmount);
      } else {
        setGameResult('save');
        setWinAmount(0);
      }

      // Add to history
      await apiRequest('/api/history', {
        method: 'POST',
        body: {
          playerId: player.id,
          gameType: 'penalty',
          betAmount,
          winAmount: response.winAmount,
          gameData: JSON.stringify({
            shotDirection,
            goalkeeperSave: response.goalkeeperSave,
            isGoal: response.isGoal
          })
        }
      });

      setGameActive(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    },
    onError: (error: Error) => {
      console.error('Ошибка при игре в пенальти:', error);
      setGameActive(false);
      setShowAnimation(false);
    }
  });

  const resetGame = () => {
    setGoalkeeperSave(null);
    setGameResult(null);
    setWinAmount(0);
    setShowAnimation(false);
    setGameActive(false);
  };

  const getDirectionText = (direction: Direction) => {
    switch (direction) {
      case 'left': return 'Левый угол';
      case 'center': return 'По центру';
      case 'right': return 'Правый угол';
    }
  };

  const getGoalkeeperPosition = () => {
    if (!goalkeeperSave) return 'translate-x-0'; // center
    switch (goalkeeperSave) {
      case 'left': return '-translate-x-8';
      case 'center': return 'translate-x-0';
      case 'right': return 'translate-x-8';
    }
  };

  const getBallPosition = () => {
    if (!gameResult) return 'translate-x-0 translate-y-0'; // center
    switch (shotDirection) {
      case 'left': return '-translate-x-12 -translate-y-4';
      case 'center': return 'translate-x-0 -translate-y-2';
      case 'right': return 'translate-x-12 -translate-y-4';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ⚽ Пенальти
          </DialogTitle>
          <DialogDescription>
            Выберите направление удара и постарайтесь забить гол в ворота!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-sm text-muted-foreground">Баланс</div>
              <div className="font-bold text-lg">{formatCurrency(player?.balance || 0)}</div>
            </div>
            <div className="bg-card p-3 rounded-lg border">
              <div className="text-sm text-muted-foreground">Ставка</div>
              <div className="font-bold text-lg">{formatCurrency(betAmount)}</div>
            </div>
          </div>

          {/* Bet Input */}
          {!gameActive && !gameResult && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Размер ставки</label>
              <Input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(Number(e.target.value))}
                min={1}
                max={player?.balance || 0}
                className="text-center"
              />
            </div>
          )}

          {/* Direction Selection */}
          {!gameActive && !gameResult && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Направление удара</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShotDirection('left')}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    shotDirection === 'left'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🥅</div>
                  <div className="font-medium">Левый угол</div>
                </button>
                <button
                  onClick={() => setShotDirection('center')}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    shotDirection === 'center'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🎯</div>
                  <div className="font-medium">По центру</div>
                </button>
                <button
                  onClick={() => setShotDirection('right')}
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    shotDirection === 'right'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-1">🥅</div>
                  <div className="font-medium">Правый угол</div>
                </button>
              </div>
            </div>
          )}

          {/* Football Field Display */}
          <div className="bg-gradient-to-b from-green-200 to-green-300 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-6 text-center border relative overflow-hidden">
            {/* Goal */}
            <div className="relative h-16 mb-8 flex items-center justify-center">
              <div className="text-4xl">🥅</div>
              
              {/* Goalkeeper */}
              <div className={`absolute text-2xl transition-transform duration-1000 ${
                goalkeeperSave ? getGoalkeeperPosition() : 'translate-x-0'
              }`}>
                🧤
              </div>
            </div>

            {/* Ball */}
            <div className="relative h-8 flex items-center justify-center">
              <div className={`text-2xl transition-all duration-1000 ${
                gameResult ? getBallPosition() : 'translate-x-0 translate-y-0'
              } ${showAnimation ? 'animate-bounce' : ''}`}>
                ⚽
              </div>
            </div>

            {/* Player */}
            <div className="mt-8">
              <div className="text-3xl">🏃</div>
            </div>

            {/* Status Text */}
            <div className="text-sm text-green-800 dark:text-green-200 mt-4">
              {showAnimation && "Удар!"}
              {!showAnimation && !gameResult && `Цель: ${getDirectionText(shotDirection)}`}
              {goalkeeperSave && !showAnimation && `Вратарь прыгнул ${getDirectionText(goalkeeperSave)}`}
            </div>
          </div>

          {/* Game Result */}
          {gameResult && (
            <div className={`text-center p-4 rounded-lg border ${
              gameResult === 'goal' 
                ? 'bg-green-500/10 border-green-500 text-green-600' 
                : 'bg-red-500/10 border-red-500 text-red-600'
            }`}>
              <div className="text-2xl mb-2">
                {gameResult === 'goal' ? '🏆' : '🧤'}
              </div>
              <div className="font-bold">
                {gameResult === 'goal' 
                  ? `ГОЛ! Выигрыш: ${formatCurrency(winAmount)}`
                  : 'Вратарь отбил мяч!'
                }
              </div>
              <div className="text-sm mt-1">
                {gameResult === 'goal' 
                  ? `Отличный удар ${getDirectionText(shotDirection)}`
                  : `Вратарь угадал и прыгнул ${getDirectionText(goalkeeperSave!)}`
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!gameActive && !gameResult && (
              <Button
                onClick={() => shootMutation.mutate()}
                disabled={shootMutation.isPending || (player?.balance || 0) < betAmount}
                className="w-full"
              >
                {shootMutation.isPending ? 'Бьем по воротам...' : `Ударить за ${formatCurrency(betAmount)}`}
              </Button>
            )}

            {gameResult && (
              <Button onClick={resetGame} className="w-full">
                Играть снова
              </Button>
            )}

            <Button onClick={onClose} variant="outline" className="w-full">
              Закрыть
            </Button>
          </div>

          {/* Game Info */}
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• Выигрыш при голе: 2x от ставки</p>
            <p>• Вратарь случайно выбирает направление</p>
            <p>• Шанс забить зависит от удачи</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}