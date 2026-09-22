export interface UserSummary {
    id: string;
    email: string;
    roles: string[];
    teamId: number | null;
}

export interface UpdateUserRequest {
    role: string;
    teamId: number;
}