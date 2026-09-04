import axiosInstance from "./axiosInstance";
import type { Team } from "../types/team";

export async function getTeams(): Promise<Team[]> {
    const response = await axiosInstance.get<Team[]>("/teams");
    return response.data;
}