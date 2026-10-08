import axiosInstance from './axiosInstance';
import type { Match } from '../types/match';

export const getMatches = async (): Promise<Match[]> => {
    const response = await axiosInstance.get<Match[]>('/matches');
    return response.data;
}

export async function createMatch(match: Omit<Match, "id">): Promise<Match> {
    const response = await axiosInstance.post<Match>('/matches', match);
    return response.data;
}

export async function updateMatch(id: number, match: Omit<Match, "id">): Promise<void> {
    await axiosInstance.put(`/matches/${id}`, match);
}

export async function deleteMatch(id: number): Promise<void> {
    await axiosInstance.delete(`/matches/${id}`);
}