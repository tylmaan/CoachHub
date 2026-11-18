export type BoardSide = "own" | "opponent";

export interface BoardPlayer {
    id: string;
    type: "player";
    side: BoardSide;
    x: number;
    y: number;
    label: string;
}

export interface BoardArrow {
    id: string;
    type: "arrow";
    side: BoardSide;
    style: "run" | "pass";
    from: { x: number; y: number };
    to: { x: number; y: number };
}

export interface BoardZone {
    id: string;
    type: "zone";
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
}

export interface BoardText {
    id: string;
    type: "text";
    x: number;
    y: number;
    text: string;
}

export interface BoardPoint {
    x: number;
    y: number;
}

export interface BoardLineupSlot {
    label: string;
    x: number;
    y: number;
}

export type BoardObject = BoardPlayer | BoardArrow | BoardZone | BoardText;

export interface TacticalBoardData {
    version: 1;
    objects: BoardObject[];
}

export const EMPTY_BOARD: TacticalBoardData = { version: 1, objects: [] };

export function parseBoardData(json: string): TacticalBoardData {
    try {
        const parsed = JSON.parse(json);
        if (parsed?.version === 1 && Array.isArray(parsed.objects)) return parsed as TacticalBoardData;
    } catch {
        // ignore
    }

    return EMPTY_BOARD;
}