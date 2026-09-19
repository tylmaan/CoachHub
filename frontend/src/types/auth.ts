export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    role: string;
    teamId: number | null;
}

export interface AuthResponse {
    token: string;
    email: string;
    roles: string[];
    teamId: number | null;
}