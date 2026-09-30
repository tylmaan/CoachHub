export interface UserSummary {
    id: string;
    email: string;
    roles: string[];
    teamId: number | null;
    fullName: string | null;
    photoUrl: string | null;
}

export interface UpdateUserRequest {
    role: string;
    teamId: number;
    fullName: string | null;
    photoUrl: string | null;
}