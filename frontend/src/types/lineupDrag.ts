export interface DragSource {
    appearanceId: number;
}

export type DropTarget = 
    | { kind: "pitch"; slotKey: string }
    | { kind: "bench" };

export function targetFromKey(key: string): DropTarget {
    return key === "bench" ? { kind: "bench" } : { kind: "pitch", slotKey: key };
}