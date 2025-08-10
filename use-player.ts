import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTelegram } from "./use-telegram";
import type { Player } from "@shared/schema";

export function usePlayer() {
  const { user } = useTelegram();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get player data
  const { data: player, isLoading } = useQuery({
    queryKey: ["/api/player", user?.id?.toString()],
    enabled: !!user?.id && !isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: async (playerData: any) => {
      const response = await apiRequest("POST", "/api/player", playerData);
      return response.json();
    },
    onSuccess: (newPlayer) => {
      queryClient.setQueryData(["/api/player", user?.id?.toString()], newPlayer);
      setIsInitialized(true);
    }
  });

  // Update balance mutation
  const updateBalanceMutation = useMutation({
    mutationFn: async (newBalance: number) => {
      await apiRequest("PATCH", `/api/player/${user?.id}/balance`, {
        balance: newBalance
      });
      return newBalance;
    },
    onSuccess: (newBalance) => {
      if (player) {
        const updatedPlayer = { ...player, balance: newBalance };
        queryClient.setQueryData(["/api/player", user?.id?.toString()], updatedPlayer);
      }
    }
  });

  // Initialize player on first load
  useEffect(() => {
    if (user && !isLoading && !player && !isInitialized) {
      const playerData = {
        telegramId: user.id.toString(),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        balance: 1000, // Starting balance
      };

      createPlayerMutation.mutate(playerData);
    } else if (player && !isInitialized) {
      setIsInitialized(true);
    }
  }, [user, player, isLoading, isInitialized]);

  const updateBalance = async (newBalance: number) => {
    return updateBalanceMutation.mutateAsync(newBalance);
  };

  return {
    player,
    isLoading: isLoading || createPlayerMutation.isPending,
    updateBalance,
    isInitialized,
  };
}
