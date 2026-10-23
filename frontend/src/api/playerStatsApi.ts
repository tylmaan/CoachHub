import axiosInstance from './axiosInstance';
import type { PlayerSeasonStats } from '../types/playerStats';

export const getPlayerStats = async (): Promise<PlayerSeasonStats[]> => {
    const response = await axiosInstance.get<PlayerSeasonStats[]>('/playerstats');
    return response.data;
};