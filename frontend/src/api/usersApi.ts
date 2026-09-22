import axiosInstance from "./axiosInstance";
import type { UserSummary, UpdateUserRequest } from "../types/user";

export async function getUsers(): Promise<UserSummary[]> {
    const response = await axiosInstance.get<UserSummary[]>("/users");
    return response.data;    
}

export async function updateUser(id: string, request: UpdateUserRequest): Promise<void> {
    await axiosInstance.put(`/users/${id}`, request);    
}

export async function deleteUser(id: string): Promise<void> {
    await axiosInstance.delete(`/users/${id}`);    
}