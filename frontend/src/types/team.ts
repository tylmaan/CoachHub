import type { UserSummary } from "./user";
import type { Kit } from "./kit";

export interface Team {
    id: number;
    name: string;
    logoUrl: string | null;
    homeKit: Kit;
    awayKit: Kit;
    goalkeeperKit: Kit;
}

export interface TeamSummary {
    id: number;
    name: string;
    logoUrl: string | null;
    homeKit: Kit;
    awayKit: Kit;
    goalkeeperKit: Kit;
    staffMembers: UserSummary[];
}