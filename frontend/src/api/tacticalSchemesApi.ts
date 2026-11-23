import axiosInstance from "./axiosInstance";
import type { TacticalScheme, TacticalSchemeRequest, TacticalBoardOwner } from "../types/tacticalScheme";

export async function getMatchTacticalSchemes(matchId: number): Promise<TacticalScheme[]> {
    const response = await axiosInstance.get<TacticalScheme[]>(`/tacticalschemes/match/${matchId}`);
    return response.data; 
}

export async function getReportTacticalSchemes(reportId: number): Promise<TacticalScheme[]> {
    const response = await axiosInstance.get<TacticalScheme[]>(`/tacticalschemes/report/${reportId}`);
    return response.data; 
}

export function getSchemesByOwner(kind: TacticalBoardOwner["kind"], id: number): Promise<TacticalScheme[]> {
    return kind === "match" ? getMatchTacticalSchemes(id) : getReportTacticalSchemes(id);
}

export async function createMatchTacticalScheme(matchId: number, request: TacticalSchemeRequest): Promise<TacticalScheme> {
    const response = await axiosInstance.post<TacticalScheme>(`/tacticalschemes/match/${matchId}`, request);
    return response.data;
}

export async function createReportTacticalScheme(reportId: number, request: TacticalSchemeRequest): Promise<TacticalScheme> {
    const response = await axiosInstance.post<TacticalScheme>(`/tacticalschemes/report/${reportId}`, request);
    return response.data;
}

export function createSchemeForOwner(
    kind: TacticalBoardOwner["kind"],
    id: number,
    request: TacticalSchemeRequest
): Promise<TacticalScheme> {
    return kind === "match" ? createMatchTacticalScheme(id, request) : createReportTacticalScheme(id, request);
}

export async function updateTacticalScheme(id: number, request: TacticalSchemeRequest): Promise<void> {
    await axiosInstance.put(`/tacticalschemes/${id}`, request);
}

export async function deleteTacticalScheme(id: number): Promise<void> {
    await axiosInstance.delete(`/tacticalschemes/${id}`);
}