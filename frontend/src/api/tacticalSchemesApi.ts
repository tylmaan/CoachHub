import axiosInstance from "./axiosInstance";
import type { TacticalScheme, TacticalSchemeRequest } from "../types/tacticalScheme";

export async function getTacticalSchemes(matchId: number): Promise<TacticalScheme[]> {
    const response = await axiosInstance.get<TacticalScheme[]>(`/tacticalschemes/match/${matchId}`);
    return response.data; 
}

export async function createTacticalScheme(matchId: number, request: TacticalSchemeRequest): Promise<TacticalScheme> {
    const response = await axiosInstance.post<TacticalScheme>(`/tacticalschemes/match/${matchId}`, request);
    return response.data;
}

export async function updateTacticalScheme(id: number, request: TacticalSchemeRequest): Promise<void> {
    await axiosInstance.put(`/tacticalschemes/${id}`, request);
}

export async function deleteTacticalScheme(id: number): Promise<void> {
    await axiosInstance.delete(`/tacticalschemes/${id}`);
}