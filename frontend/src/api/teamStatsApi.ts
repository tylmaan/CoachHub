import axiosInstance from "./axiosInstance";
import type { TeamSeasonStats } from "../types/teamStats";

export const getTeamStats = async (): Promise<TeamSeasonStats[]> => {
    const response = await axiosInstance.get<TeamSeasonStats[]>('/teamstats');
    return response.data;
}