export interface PlayerSeasonStats {
    playerId: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    season: string;
    matches: number;
    minutes: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
}