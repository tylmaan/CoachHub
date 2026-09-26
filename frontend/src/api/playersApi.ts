import axiosInstance from "./axiosInstance";
import type { Player } from "../types/player";

export const getPlayers = async (): Promise<Player[]> => {
    const response = await axiosInstance.get<Player[]>('/players');
    return response.data;
}

export async function createPlayer(player: Omit<Player, "id">): Promise<Player> {
    const response = await axiosInstance.post<Player>("/players", player);
    return response.data;
}

export async function updatePlayer(id: number, player: Omit<Player, "id">): Promise<void> {
    await axiosInstance.put(`/players/${id}`, player);
}

export async function deletePlayer(id: number): Promise<void> {
    await axiosInstance.delete(`/players/${id}`);
}