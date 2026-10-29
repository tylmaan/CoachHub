export interface DragSource {
    appearanceId: number;
}

export type DropTarget = 
    | { kind: "pitch"; slotKey: string }
    | { kind: "bench" };