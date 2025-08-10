import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameUtils } from "@/lib/game-utils";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CoinflipModalProps {
  onClose: () => void;
}

type CoinSide = 'heads' | 'tails';

export default function CoinflipModal({ onClose }: CoinflipModalProps) {
  const [betAmount, setBetAmount] = useState<number>(5);
  const [playerChoice, setPlayerChoice] = useState<CoinSide>('heads');
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [flipping, setFlipping] = useState<boolean>(false);
  
  const { formatCurrency } = useGameUtils();
  const { player, updateBalance } = usePlayer();
  const queryClient = useQueryClient();

  const flipCoinMutation = useMutation({
    mutationFn: async () => {
      if (!player || player.balance < betAmount) {
        throw new Error("Недостаточно средств");
      }

      setGameActive(true);
      setFlipping(true);
      setResult(null);
      setGameResult(null);

      // Deduct bet amount
      await updateBalance(player.balance - betAmount);

      // Create game state
      await apiRequest('/api/coinflip', {
        method: 'POST',
        body: {
          playerId: player.id,
          betAmount,
          playerChoice,
          gameStatus: 'active',
          isActive: true
        }
      });

      // Simulate coin flip delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get flip result from server
      const response = await apiRequest('/api/coinflip/flip', {
        method: 'POST',
        body: {
          playerChoice,
          betAmount
        }
      });

      setResult(response.result);
      setFlipping(false);
      
      if (response.isWin) {
        setGameResult('win');
        setWinAmount(response.winAmount);
        
        // Add winnings to balance
        await updateBalance(player.balance + response.winAmount);
      } else {
        setGameResult('lose');
        setWinAmount(0);
      }

      // Add to history
      await apiRequest('/api/history', {
        method: 'POST',
        body: {
          playerId: player.id,
          gameType: 'coinflip',
          betAmount,
          winAmount: response.winAmount,
          gameData: JSON.stringify({
            playerChoice,
            result: response.result,
            isWin: response.isWin
          })
        }
      });

      setGameActive(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    },
    onError: (error: Error) => {
      console.error('Ошибка при игре в орел/решка:', error);
      setGameActive(false);
      setFlipping(false);
    }
  });

  const resetGame = () => {
    setResult(null);
    setGameResult(null);
    setWinAmount(0);
    setFlipping(false);
    setGameActive(false);
  };

  const getSideEmoji = (side: CoinSide) => {
    return side === 'heads' ? '🦅' : '👑';
  };

  const getSideText = (side: CoinSide) => {
    return side === 'heads' ? 'Орел' : 'Решка';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🪙 Орел или Решка
          </DialogTitle>
          <DialogDescription>
            Выберите сторону монеты и удвойте свою ставку, если угадаете правильно!
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

          {/* Choice Selection */}
          {!gameActive && !gameResult && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Выберите сторону</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPlayerChoice('heads')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    playerChoice === 'heads'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">🦅</div>
                  <div className="font-medium">Орел</div>
                </button>
                <button
                  onClick={() => setPlayerChoice('tails')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    playerChoice === 'tails'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-3xl mb-2">👑</div>
                  <div className="font-medium">Решка</div>
                </button>
              </div>
            </div>
          )}

          {/* Coin Display */}
          <div className="bg-gradient-to-b from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10 rounded-xl p-8 text-center border">
            <div className={`text-8xl mb-4 transition-all duration-500 ${
              flipping ? 'animate-spin' : ''
            }`}>
              {flipping 
                ? '🪙' 
                : result 
                  ? getSideEmoji(result)
                  : getSideEmoji(playerChoice)
              }
            </div>
            
            <div className="text-lg font-medium">
              {flipping 
                ? 'Монета крутится...'
                : result 
                  ? `Выпало: ${getSideText(result)}`
                  : `Ваш выбор: ${getSideText(playerChoice)}`
              }
            </div>

            {!flipping && !result && (
              <div className="text-sm text-muted-foreground mt-2">
                Возможный выигрыш: {formatCurrency(betAmount * 2)}
              </div>
            )}
          </div>

          {/* Game Result */}
          {gameResult && (
            <div className={`text-center p-4 rounded-lg border ${
              gameResult === 'win' 
                ? 'bg-green-500/10 border-green-500 text-green-600' 
                : 'bg-red-500/10 border-red-500 text-red-600'
            }`}>
              <div className="text-2xl mb-2">
                {gameResult === 'win' ? '🎉' : '😔'}
              </div>
              <div className="font-bold">
                {gameResult === 'win' 
                  ? `Поздравляем! Выигрыш: ${formatCurrency(winAmount)}`
                  : `Не угадали. Выпало: ${getSideText(result!)}`
                }
              </div>
              <div className="text-sm mt-1">
                {gameResult === 'win' 
                  ? `Вы выбрали ${getSideText(playerChoice)} и выиграли!`
                  : `Вы выбрали ${getSideText(playerChoice)}, но выпало ${getSideText(result!)}`
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!gameActive && !gameResult && (
              <Button
                onClick={() => flipCoinMutation.mutate()}
                disabled={flipCoinMutation.isPending || (player?.balance || 0) < betAmount}
                className="w-full"
              >
                {flipCoinMutation.isPending ? 'Бросаем монету...' : `Бросить за ${formatCurrency(betAmount)}`}
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
            <p>• Вероятность выигрыша: 50%</p>
            <p>• Выигрыш: 2x от ставки</p>
            <p>• Простая игра на удачу</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}