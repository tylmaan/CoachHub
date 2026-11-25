import type { UserSummary } from "./user";
import type { Team } from "./team";

export type RoleFilter = "ALL" | "Coach" | "AssistantCoach" | "Analyst";

export interface UserGroup {
    teamId: number | null;
    teamName: string;
    users: UserSummary[];
}

const ROLE_ORDER = ["Coach", "AssistantCoach", "Analyst"];

function roleRank(user: UserSummary): number {
    const rank = ROLE_ORDER.indexOf(user.roles[0]);
    return rank === -1 ? ROLE_ORDER.length : rank;
}

export function userLabel(user: UserSummary): string {
    return user.fullName?.trim() ?? user.email;
}

export function userInitials(user: UserSummary): string {
    const words = (user.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return user.email[0].toUpperCase();
    return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

export function matchesUser(user: UserSummary, role: RoleFilter, query: string): boolean {
    if (role !== "ALL" && !user.roles.includes(role)) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${user.fullName ?? ""} ${user.email}`.toLowerCase().includes(q);
}

export function countByRole(users: UserSummary[]): Record<RoleFilter, number> {
    return {
        ALL: users.length,
        Coach: users.filter((u) => u.roles.includes("Coach")).length,
        AssistantCoach: users.filter((u) => u.roles.includes("AssistantCoach")).length,
        Analyst: users.filter((u) => u.roles.includes("Analyst")).length,
    };
}

export function groupByTeam(users: UserSummary[], teams: Team[]): UserGroup[] {
    const names = new Map(teams.map((team) => [team.id, team.name]));
    const groups = new Map<number | null, UserGroup>();

    for (const user of users) {
        let group = groups.get(user.teamId);
        if (!group) {
            group = {
                teamId: user.teamId,
                teamName: user.teamId === null ? "Bez drużyny" : (names.get(user.teamId) ?? "Nieznana drużyna"),
                users: [],
            };
            groups.set(user.teamId, group);
        }
        group.users.push(user);
    }

    const result = [...groups.values()];
    for (const group of result) {
        group.users.sort((a, b) => roleRank(a) - roleRank(b) 
        || userLabel(a).localeCompare(userLabel(b), "pl"));
    }
    return result.sort((a, b) => {
        if (a.teamId === null) return 1;
        if (b.teamId === null) return -1;
        return a.teamName.localeCompare(b.teamName, "pl");
    });
}