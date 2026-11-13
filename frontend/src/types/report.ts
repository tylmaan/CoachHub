export interface Report {
    id: number,
    title: string,
    content: string,
    priority: ReportPriority,
    isRead: boolean,
    createdAt: string,
    playerId: number | null,
    playerName: string | null,
    playerPhotoUrl: string | null,
    teamId: number | null,
    teamName: string | null,
    teamLogoUrl: string | null,
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
    priority: ReportPriority,
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

export type ReportPriority = "Low" | "Normal" | "High";

export const REPORT_PRIORITY_LABELS: Record<ReportPriority, string> = {
    Low: "Niski",
    Normal: "Normalny",
    High: "Wysoki",
};

export interface ReportPage {
    items: Report[],
    hasMore: boolean,
    unreadCount: number,
    authors: { id: string, name: string }[],
}

export interface ReportFilters {
    days: number,
    kinds: ReportKind[],
    authors: string[],
    unreadOnly: boolean,
    highPriorityOnly: boolean,
    search: string,
}

export function reportSubject(report: Pick<Report, "playerName" | "teamName" | "matchOpponent">): string {
    const subject = report.playerName ?? report.teamName ?? "";
    return report.matchOpponent ? `${subject} vs ${report.matchOpponent}` : `${subject} - raport`;
}