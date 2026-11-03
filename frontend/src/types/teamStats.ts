export interface TeamMatchResult {
    matchId: number;
    date: string;
    opponent: string;
    matchType: string | null;
    isHome: boolean | null;
    scoreFor: number;
    scoreAgainst: number;
}

export interface TeamSeasonStats {
    season: string;
    results: TeamMatchResult[];
    goalsScoredByPeriod: number[];
    goalsConcededByPeriod: number[];
    yellowCards: number;
    redCards: number;
}

export interface SeasonSummary {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    cleanSheets: number;
}

export interface RankingRow {
    name: string;
    value: number;
}

export type MinutesMetric = "minutes" | "matches";
export type RankingMetric = "goals" | "assists" | "yellowCards";