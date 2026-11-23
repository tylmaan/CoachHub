import { MATCH_TYPE_LABELS } from "../constants/labels";
import type { Match } from "./match";

export function daysUntil(date: string): number {
    const [year, month, day] = date.split("-").map(Number);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((new Date(year, month - 1, day).getTime() - today.getTime()) / 864e5);
}

export function countdownLabel(days: number): string {
    if (days < 0) return "po terminie";
    if (days === 0) return "dzisiaj";
    if (days === 1) return "jutro";
    return `za ${days} dni`;
}

export function nextMatches(matches: Match[], count: number): Match[] {
    return matches
        .filter((m) => m.status === "Planned" && daysUntil(m.date) >= 0)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, count);
}

export function matchTypeLabel(match: Match, teamLeague: string | null): string {
    if (match.matchType === "League") return teamLeague ?? MATCH_TYPE_LABELS.League;
    if (match.matchType === "Cup") return match.competition ?? MATCH_TYPE_LABELS.Cup;
    if (match.matchType) return MATCH_TYPE_LABELS[match.matchType] ?? match.matchType;
    return "-";
}

export function parseMatchDate(date: string): Date {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
}

export function roundLabel(match: Match): string | null {
    if (!match.round) return null;
    return match.matchType === "League" ? `kolejka ${match.round}` : match.round;
}