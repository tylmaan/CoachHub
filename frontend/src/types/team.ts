import type { UserSummary } from "./user";

export interface Team {
    id: number;
    name: string;
    logoUrl: string | null;
}

export interface TeamSummary {
    id: number;
    name: string;
    logoUrl: string | null;
    staffMembers: UserSummary[];
}