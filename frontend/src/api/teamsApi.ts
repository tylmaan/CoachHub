import axiosInstance from "./axiosInstance";
import type { Team } from "../types/team";

export async function getTeams(): Promise<Team[]> {
    const response = await axiosInstance.get<Team[]>("/teams");
    return response.data;
}

export async function createTeam(team: Omit<Team, "id">): Promise<Team> {
    const response = await axiosInstance.post<Team>("/teams", team);
    return response.data;
}

export async function updateTeam(id: number, team: Omit<Team, "id">): Promise<void> {
    await axiosInstance.put(`/teams/${id}`, team);
}

export async function deleteTeam(id: number): Promise<void> {
    await axiosInstance.delete(`/teams/${id}`);
}