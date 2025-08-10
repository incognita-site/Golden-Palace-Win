import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameUtils } from "@/lib/game-utils";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface CrashModalProps {
  onClose: () => void;
}

export default function CrashModal({ onClose }: CrashModalProps) {
  const [betAmount, setBetAmount] = useState<number>(15);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1.00);
  const [crashMultiplier, setCrashMultiplier] = useState<number | null>(null);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [winAmount, setWinAmount] = useState<number>(0);
  
  const { formatCurrency, generateCrashMultiplier } = useGameUtils();
  const { player, updateBalance } = usePlayer();
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startGameMutation = useMutation({
    mutationFn: async () => {
      if (!player || player.balance < betAmount) {
        throw new Error("Недостаточно средств");
      }

      // Get crash point from server
      const response = await apiRequest('/api/crash/start', {
        method: 'POST',
        body: {}
      });
      
      setCrashMultiplier(response.crashMultiplier);
      setCurrentMultiplier(1.00);
      setCashedOut(false);
      setGameResult(null);
      setWinAmount(0);
      setGameActive(true);

      // Deduct bet amount
      await updateBalance(player.balance - betAmount);
      
      // Create game state
      await apiRequest('/api/crash', {
        method: 'POST',
        body: {
          playerId: player.id,
          betAmount,
          gameStatus: 'flying',
          isActive: true
        }
      });

      // Start multiplier animation
      startMultiplierAnimation(response.crashMultiplier);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    },
    onError: (error: Error) => {
      console.error('Ошибка при создании игры crash:', error);
    }
  });

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      if (!gameActive || cashedOut || !crashMultiplier) return;
      
      const finalWinAmount = Math.floor(betAmount * currentMultiplier);
      setWinAmount(finalWinAmount);
      setCashedOut(true);
      setGameResult('win');
      
      if (player) {
        await updateBalance(player.balance + finalWinAmount);
      }
      
      // Add to history
      await apiRequest('/api/history', {
        method: 'POST',
        body: {
          playerId: player?.id,
          gameType: 'crash',
          betAmount,
          winAmount: finalWinAmount,
          gameData: JSON.stringify({
            cashOutMultiplier: currentMultiplier,
            crashMultiplier,
            cashedOut: true
          })
        }
      });
      
      // Stop animation
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setGameActive(false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    }
  });

  const startMultiplierAnimation = (crashPoint: number) => {
    let multiplier = 1.00;
    const increment = 0.01;
    const speed = 100; // ms

    intervalRef.current = setInterval(() => {
      multiplier += increment;
      setCurrentMultiplier(multiplier);

      // Check if crashed
      if (multiplier >= crashPoint) {
        // Game crashed
        if (!cashedOut) {
          setGameResult('lose');
          
          // Add to history
          apiRequest('/api/history', {
            method: 'POST',
            body: {
              playerId: player?.id,
              gameType: 'crash',
              betAmount,
              winAmount: 0,
              gameData: JSON.stringify({
                crashMultiplier: crashPoint,
                finalMultiplier: multiplier,
                crashed: true
              })
            }
          });
        }
        
        setGameActive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    }, speed);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const resetGame = () => {
    setGameActive(false);
    setCurrentMultiplier(1.00);
    setCrashMultiplier(null);
    setCashedOut(false);
    setGameResult(null);
    setWinAmount(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const getMultiplierColor = () => {
    if (!gameActive) return 'text-muted-foreground';
    if (cashedOut) return 'text-green-500';
    if (currentMultiplier < 2) return 'text-blue-500';
    if (currentMultiplier < 5) return 'text-yellow-500';
    if (currentMultiplier < 10) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ✈️ Самолетик
          </DialogTitle>
          <DialogDescription>
            Следите за ростом множителя и заберите выигрыш до того, как самолет улетит!
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

          {/* Game Display */}
          <div className="bg-gradient-to-b from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl p-8 text-center border">
            {/* Multiplier Display */}
            <div className={`text-6xl font-bold mb-4 ${getMultiplierColor()}`}>
              {currentMultiplier.toFixed(2)}x
            </div>
            
            {/* Airplane Animation */}
            <div className="relative h-20 mb-4">
              <div className={`text-4xl absolute inset-0 flex items-center justify-center transition-all duration-200 ${
                gameActive ? 'animate-bounce' : ''
              }`}>
                {gameResult === 'lose' && crashMultiplier ? '💥' : '✈️'}
              </div>
              
              {/* Flight trail */}
              {gameActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                </div>
              )}
            </div>

            {/* Current Win Display */}
            {gameActive && !cashedOut && (
              <div className="text-lg font-medium text-primary">
                Возможный выигрыш: {formatCurrency(Math.floor(betAmount * currentMultiplier))}
              </div>
            )}

            {/* Status Text */}
            <div className="text-sm text-muted-foreground mt-2">
              {!gameActive && !gameResult && "Нажмите 'Играть', чтобы начать"}
              {gameActive && !cashedOut && "Самолет летит... Заберите выигрыш!"}
              {cashedOut && "Выигрыш забран!"}
              {gameResult === 'lose' && `Самолет улетел на ${crashMultiplier?.toFixed(2)}x`}
            </div>
          </div>

          {/* Game Result */}
          {gameResult && (
            <div className={`text-center p-4 rounded-lg border ${
              gameResult === 'win' 
                ? 'bg-green-500/10 border-green-500 text-green-600' 
                : 'bg-red-500/10 border-red-500 text-red-600'
            }`}>
              <div className="text-2xl mb-2">
                {gameResult === 'win' ? '🎉' : '💥'}
              </div>
              <div className="font-bold">
                {gameResult === 'win' 
                  ? `Выигрыш: ${formatCurrency(winAmount)}!`
                  : 'Самолет улетел!'
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!gameActive && !gameResult && (
              <Button
                onClick={() => startGameMutation.mutate()}
                disabled={startGameMutation.isPending || (player?.balance || 0) < betAmount}
                className="w-full"
              >
                {startGameMutation.isPending ? 'Запуск...' : `Играть за ${formatCurrency(betAmount)}`}
              </Button>
            )}

            {gameActive && !cashedOut && (
              <Button
                onClick={() => cashOutMutation.mutate()}
                disabled={cashOutMutation.isPending}
                variant="secondary"
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {cashOutMutation.isPending 
                  ? 'Забираем...' 
                  : `ЗАБРАТЬ ${formatCurrency(Math.floor(betAmount * currentMultiplier))}`
                }
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
            <p>• Множитель растет с каждой секундой</p>
            <p>• Заберите выигрыш до того, как самолет улетит</p>
            <p>• Максимальный множитель: 100x</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}