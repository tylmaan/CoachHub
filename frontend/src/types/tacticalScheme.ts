export interface TacticalScheme {
    id: number;
    name: string;
    data: string;
    matchId: number;
    createdAt: string;
    updatedAt: string;
}

export interface TacticalSchemeRequest {
    name: string;
    data: string;
}