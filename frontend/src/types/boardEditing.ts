import type { BoardObject, BoardPoint, BoardSide } from "./tacticalBoard";

const POINT_MARGIN_X = 0.065;
const POINT_MARGIN_Y = 0.045;

export type Tool = "select" | "ownPlayer" | "opponentPlayer" | "text";

function round(value: number) {
    return Math.round(value * 10000) / 10000;
}

function clamp01(value: number) {
    return Math.min(Math.max(value, 0), 1);
}

function keepInside(point: BoardPoint): BoardPoint {
    return {
        x: round(Math.min(Math.max(point.x, POINT_MARGIN_X), 1 - POINT_MARGIN_X)),
        y: round(Math.min(Math.max(point.y, POINT_MARGIN_Y), 1 - POINT_MARGIN_Y))
    };
}

export function newId() {
    return crypto.randomUUID();
} 

export function toBoardPoint(event: { clientX: number; clientY: number }, svg: SVGSVGElement): BoardPoint {
    const rect = svg.getBoundingClientRect();
    return {
        x: round(clamp01((event.clientX - rect.left) / rect.width)),
        y: round(clamp01((event.clientY - rect.top) / rect.height))
    };
}

function bounds(object: BoardObject) {
    switch (object.type) {
        case "player":
        case "text":
            return { 
                minX: object.x - POINT_MARGIN_X,
                maxX: object.x + POINT_MARGIN_X, 
                minY: object.y - POINT_MARGIN_Y, 
                maxY: object.y + POINT_MARGIN_Y 
            };
        case "zone":
            return { minX: object.x, maxX: object.x + object.width, minY: object.y, maxY: object.y + object.height };
        case "arrow":
            return {
                minX: Math.min(object.from.x, object.to.x),
                maxX: Math.max(object.from.x, object.to.x),
                minY: Math.min(object.from.y, object.to.y),
                maxY: Math.max(object.from.y, object.to.y)
            };
    }
}

export function moveObject(object: BoardObject, dx: number, dy: number): BoardObject {
    const b = bounds(object);
    const mx = Math.min(Math.max(dx, -b.minX), 1 - b.maxX);
    const my = Math.min(Math.max(dy, -b.minY), 1 - b.maxY);

    switch (object.type) {
        case "player":
        case "text":
        case "zone":
            return { ...object, x: round(object.x + mx), y: round(object.y + my) };
        case "arrow":
            return {
                ...object,
                from: { x: round(object.from.x + mx), y: round(object.from.y + my) },
                to: { x: round(object.to.x + mx), y: round(object.to.y + my) }
            };
    }
}

function nextLabel(objects: BoardObject[], side: BoardSide) {
    const used = new Set(objects.flatMap((o) => o.type === "player" && o.side === side ? [o.label] : []));
    let n = 1;
    while (used.has(n.toString())) n++;
    return String(n);
}

export function createObject(tool: Exclude<Tool, "select">, point: BoardPoint, objects: BoardObject[]): BoardObject {
    const p = keepInside(point);

    if (tool === "text") {
        return {
            id: newId(),
            type: "text",
            x: p.x,
            y: p.y,
            text: "Tekst"
        };
    }
    const side: BoardSide = tool === "ownPlayer" ? "own" : "opponent";
    return {
        id: newId(),
        type: "player",
        side,
        x: p.x,
        y: p.y,
        label: nextLabel(objects, side)
    };
}