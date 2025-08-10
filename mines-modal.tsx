import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameUtils } from "@/lib/game-utils";
import { usePlayer } from "@/hooks/use-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface MinesModalProps {
  onClose: () => void;
}

export default function MinesModal({ onClose }: MinesModalProps) {
  const [betAmount, setBetAmount] = useState<number>(20);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [revealedCells, setRevealedCells] = useState<number[]>([]);
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(1);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  
  const { formatCurrency, generateMineField, calculateMinesMultiplier } = useGameUtils();
  const { player, updateBalance } = usePlayer();
  const queryClient = useQueryClient();

  const startGameMutation = useMutation({
    mutationFn: async () => {
      if (!player || player.balance < betAmount) {
        throw new Error("Недостаточно средств");
      }

      // Generate mine field
      const mines = generateMineField(25, 5); // 5x5 grid with 5 mines
      setMinePositions(mines);
      setRevealedCells([]);
      setCurrentMultiplier(1);
      setGameActive(true);
      setGameOver(false);
      setGameResult(null);

      // Deduct bet amount
      await updateBalance(player.balance - betAmount);
      
      // Create game state
      await apiRequest('/api/mines', {
        method: 'POST',
        body: {
          playerId: player.id,
          betAmount,
          minePositions: mines,
          revealedCells: [],
          currentMultiplier: 1,
          gameStatus: 'active',
          isActive: true
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    },
    onError: (error: Error) => {
      console.error('Ошибка при создании игры в мины:', error);
    }
  });

  const revealCellMutation = useMutation({
    mutationFn: async (cellIndex: number) => {
      const response = await apiRequest('/api/mines/reveal', {
        method: 'POST',
        body: {
          playerId: player?.id,
          cellIndex,
          minePositions
        }
      });
      return response;
    },
    onSuccess: (data, cellIndex) => {
      if (data.isMine) {
        // Game over - hit mine
        setGameOver(true);
        setGameActive(false);
        setGameResult('lose');
        
        // Add to history
        apiRequest('/api/history', {
          method: 'POST',
          body: {
            playerId: player?.id,
            gameType: 'mines',
            betAmount,
            winAmount: 0,
            gameData: JSON.stringify({
              revealedCells: [...revealedCells, cellIndex],
              hitMine: true,
              finalMultiplier: currentMultiplier
            })
          }
        });
      } else {
        // Safe cell revealed
        const newRevealed = [...revealedCells, cellIndex];
        setRevealedCells(newRevealed);
        
        // Calculate new multiplier
        const newMultiplier = calculateMinesMultiplier(newRevealed.length, 25, 5);
        setCurrentMultiplier(newMultiplier);
        
        // Check if all safe cells revealed (20 safe cells out of 25 total)
        if (newRevealed.length === 20) {
          // Player wins!
          const winAmount = Math.floor(betAmount * newMultiplier);
          setGameOver(true);
          setGameActive(false);
          setGameResult('win');
          
          // Add winnings to balance
          if (player) {
            updateBalance(player.balance + winAmount);
          }
          
          // Add to history
          apiRequest('/api/history', {
            method: 'POST',
            body: {
              playerId: player?.id,
              gameType: 'mines',
              betAmount,
              winAmount,
              gameData: JSON.stringify({
                revealedCells: newRevealed,
                allSafeCellsRevealed: true,
                finalMultiplier: newMultiplier
              })
            }
          });
        }
      }
    }
  });

  const cashOutMutation = useMutation({
    mutationFn: async () => {
      const winAmount = Math.floor(betAmount * currentMultiplier);
      
      if (player) {
        await updateBalance(player.balance + winAmount);
      }
      
      // Add to history
      await apiRequest('/api/history', {
        method: 'POST',
        body: {
          playerId: player?.id,
          gameType: 'mines',
          betAmount,
          winAmount,
          gameData: JSON.stringify({
            revealedCells,
            cashedOut: true,
            finalMultiplier: currentMultiplier
          })
        }
      });
      
      setGameOver(true);
      setGameActive(false);
      setGameResult('win');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/player'] });
    }
  });

  const handleCellClick = (cellIndex: number) => {
    if (!gameActive || gameOver || revealedCells.includes(cellIndex)) return;
    revealCellMutation.mutate(cellIndex);
  };

  const resetGame = () => {
    setGameActive(false);
    setGameOver(false);
    setMinePositions([]);
    setRevealedCells([]);
    setCurrentMultiplier(1);
    setGameResult(null);
  };

  const renderGrid = () => {
    const cells = [];
    for (let i = 0; i < 25; i++) {
      const isRevealed = revealedCells.includes(i);
      const isMine = minePositions.includes(i);
      const showMine = gameOver && isMine;
      
      cells.push(
        <button
          key={i}
          className={`
            w-12 h-12 border-2 rounded-lg font-bold text-lg transition-all duration-200
            ${isRevealed 
              ? (isMine ? 'bg-red-500 border-red-600 text-white' : 'bg-green-500 border-green-600 text-white')
              : 'bg-card border-border hover:border-primary hover:bg-card/80'
            }
            ${showMine ? 'bg-red-500 border-red-600' : ''}
            ${!gameActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          onClick={() => handleCellClick(i)}
          disabled={!gameActive || gameOver || revealedCells.includes(i)}
        >
          {isRevealed 
            ? (isMine ? '💣' : '💎')
            : showMine 
              ? '💣' 
              : ''
          }
        </button>
      );
    }
    return cells;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            💣 Мины
          </DialogTitle>
          <DialogDescription>
            Найдите все алмазы, избегая мин. Чем больше откроете, тем выше множитель!
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
              <div className="text-sm text-muted-foreground">Множитель</div>
              <div className="font-bold text-lg text-primary">{currentMultiplier.toFixed(2)}x</div>
            </div>
          </div>

          {/* Bet Input */}
          {!gameActive && (
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

          {/* Game Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 justify-center mx-auto w-fit">
              {renderGrid()}
            </div>
            
            {/* Game Info */}
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                Открыто ячеек: {revealedCells.length}/20 • Мин: 5
              </div>
              {gameActive && (
                <div className="text-sm font-medium text-primary">
                  Возможный выигрыш: {formatCurrency(Math.floor(betAmount * currentMultiplier))}
                </div>
              )}
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
                  ? `Выигрыш: ${formatCurrency(Math.floor(betAmount * currentMultiplier))}!`
                  : 'Вы наткнулись на мину!'
                }
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!gameActive && !gameOver && (
              <Button
                onClick={() => startGameMutation.mutate()}
                disabled={startGameMutation.isPending || (player?.balance || 0) < betAmount}
                className="w-full"
              >
                {startGameMutation.isPending ? 'Начинаем...' : `Играть за ${formatCurrency(betAmount)}`}
              </Button>
            )}

            {gameActive && !gameOver && revealedCells.length > 0 && (
              <Button
                onClick={() => cashOutMutation.mutate()}
                disabled={cashOutMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                {cashOutMutation.isPending 
                  ? 'Забираем...' 
                  : `Забрать ${formatCurrency(Math.floor(betAmount * currentMultiplier))}`
                }
              </Button>
            )}

            {gameOver && (
              <Button onClick={resetGame} className="w-full">
                Играть снова
              </Button>
            )}

            <Button onClick={onClose} variant="outline" className="w-full">
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}