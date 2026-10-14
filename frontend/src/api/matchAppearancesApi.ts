import axiosInstance from "./axiosInstance";
import type { MatchAppearance } from "../types/matchAppearance";

export const getMatchAppearances = async (matchId: number): Promise<MatchAppearance[]> => {
    const response = await axiosInstance.get<MatchAppearance[]>(`/matchappearances/match/${matchId}`);
    return response.data;
}

export async function createMatchAppearance(appearance: Omit<MatchAppearance, "id">): Promise<MatchAppearance> {
    const response = await axiosInstance.post<MatchAppearance>("/matchappearances", appearance);
    return response.data;
}

export async function updateMatchAppearance(id: number, appearance: Omit<MatchAppearance, "id">): Promise<void> {
    await axiosInstance.put(`/matchappearances/${id}`, appearance);
}

export async function deleteMatchAppearance(id: number): Promise<void> {
    await axiosInstance.delete(`/matchappearances/${id}`);
}