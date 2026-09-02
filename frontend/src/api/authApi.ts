import axiosInstance from './axiosInstance';
import type { LoginRequest, AuthResponse } from '../types/auth';

export async function login(request: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', request);
    return response.data;
}