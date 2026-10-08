export interface Match {
    id: number;
    date: string;
    opponent: string;
    season: string;
    teamId: number;
    scoreFor: number | null;
    scoreAgainst: number | null;
}