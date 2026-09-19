import axiosInstance from './axiosInstance';
import type { LoginRequest, AuthResponse, RegisterRequest } from '../types/auth';

export async function login(request: LoginRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', request);
    return response.data;
}

export async function register(request: RegisterRequest): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>("/auth/register", request);
    return response.data;
}