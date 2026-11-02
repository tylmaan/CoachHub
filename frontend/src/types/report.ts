export interface Report {
    id: number,
    title: string,
    content: string,
    createdAt: string,
    playerId: number | null,
    playerName: string | null,
    teamId: number | null,
    matchId: number | null,
    matchOpponent: string | null,
    matchDate: string | null,
    authorId: string,
    authorName: string,
    canEdit: boolean,
}

export interface ReportRequest {
    title: string,
    content: string,
    playerId: number | null,
    teamId: number | null,
    matchId: number | null,
}

export type ReportKind = "PlayerMatch" | "PlayerGeneral" | "TeamMatch" | "TeamGeneral";

export const REPORT_KIND_LABELS: Record<ReportKind, string> = {
    PlayerMatch: "Zawodnik - mecz",
    PlayerGeneral: "Zawodnik - ogólny",
    TeamMatch: "Drużyna - mecz",
    TeamGeneral: "Drużyna - ogólny",
};

export function reportKind(report: Pick<Report, "playerId" | "matchId">): ReportKind {
    if (report.playerId !== null) return report.matchId !== null ? "PlayerMatch" : "PlayerGeneral";
    return report.matchId !== null ? "TeamMatch" : "TeamGeneral";
}