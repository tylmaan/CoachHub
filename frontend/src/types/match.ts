export interface Match {
    id: number;
    date: string;
    opponent: string;
    season: string;
    teamId: number;
    scoreFor: number | null;
    scoreAgainst: number | null;
    isHome: boolean | null;
    matchType: string | null;
    competition: string | null;
    round: string | null;
    formation: string | null;
    opponentLogoUrl: string | null;
}