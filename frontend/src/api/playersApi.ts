import axiosInstance from "./axiosInstance";
import type { Player, PlayerDeletionImpact } from "../types/player";

export const getPlayers = async (): Promise<Player[]> => {
    const response = await axiosInstance.get<Player[]>('/players');
    return response.data;
}

export async function createPlayer(player: Omit<Player, "id" | "archivedAt">): Promise<Player> {
    const response = await axiosInstance.post<Player>("/players", player);
    return response.data;
}

export async function updatePlayer(id: number, player: Omit<Player, "id" | "archivedAt">): Promise<void> {
    await axiosInstance.put(`/players/${id}`, player);
}

export async function deletePlayer(id: number): Promise<void> {
    await axiosInstance.delete(`/players/${id}`);
}

export async function archivePlayer(id: number): Promise<void> {
    await axiosInstance.post(`/players/${id}/archive`);
}

export async function restorePlayer(id: number): Promise<void> {
    await axiosInstance.post(`/players/${id}/restore`);
}

export async function getPlayerDeletionImpact(id: number): Promise<PlayerDeletionImpact> {
    const response = await axiosInstance.get<PlayerDeletionImpact>(`/players/${id}/deletion-impact`);
    return response.data;
}