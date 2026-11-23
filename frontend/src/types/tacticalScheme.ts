export interface TacticalScheme {
    id: number;
    name: string;
    data: string;
    matchId: number | null;
    reportId: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface TacticalSchemeRequest {
    name: string;
    data: string;
}

export type TacticalBoardOwner = { kind: "match" | "report"; id: number };