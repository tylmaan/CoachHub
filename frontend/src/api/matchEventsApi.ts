import axiosInstance from "./axiosInstance";
import type { MatchEvent } from "../types/matchEvent";

export const getMatchEvents = async (matchId: number): Promise<MatchEvent[]> => {
    const response = await axiosInstance.get<MatchEvent[]>(`/matchevents/match/${matchId}`);
    return response.data;
}

export async function createMatchEvent(event: Omit<MatchEvent, "id">): Promise<MatchEvent> {
    const response = await axiosInstance.post<MatchEvent>("/matchevents", event);
    return response.data;
}

export async function updateMatchEvent(id: number, event: Omit<MatchEvent, "id">): Promise<void> {
    await axiosInstance.put(`/matchevents/${id}`, event);
}

export async function deleteMatchEvent(id: number): Promise<void> {
    await axiosInstance.delete(`/matchevents/${id}`);
}