import axiosInstance from "./axiosInstance";
import type { Player } from "../types/player";

export const getPlayers = async (): Promise<Player[]> => {
    const response = await axiosInstance.get<Player[]>('/players');
    return response.data;
}