import { useEffect, useRef } from "react";

const HOLD_MS = 350;
const CANCEL_DISTANCE = 10;
const EDGE_ZONE = 80;
const SCROLL_STEP = 12;

export const COARSE_POINTER = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

interface TouchDragCallbacks {
    onStart: (appearanceId: number) => void;
    onOver: (key: string) => void;
    onLeave: (key: string) => void;
    onDrop: (key: string) => void;
    onEnd: () => void;
}

interface ActiveDrag {
    pointerId: number;
    appearanceId: number;
    source: HTMLElement;
    startX: number;
    startY: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    ghost: HTMLElement | null;
    timer: number | null;
    raf: number | null;
    overKey: string | null;
}

function blockScroll(e: TouchEvent) {
    if (e.cancelable) e.preventDefault();
}

function dropKeyAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    return el?.closest<HTMLElement>("[data-drop-key]")?.dataset.dropKey ?? null;
}

export function useTouchDrag(enabled: boolean, callbacks: TouchDragCallbacks) {
    const latest = useRef(callbacks);
    const drag = useRef<ActiveDrag | null>(null);
    const clickBlocked = useRef(false);

    useEffect(() => {
        latest.current = callbacks;
    });

    function syncOver(d: ActiveDrag) {
        const key = dropKeyAt(d.x, d.y);
        if (key === d.overKey) return;
        if (d.overKey) latest.current.onLeave(d.overKey);
        if (key) latest.current.onOver(key);
        d.overKey = key;
    }

    function tick() {
        const d = drag.current;
        if (!d || !d.ghost) return;
        const dy = d.y < EDGE_ZONE ? -SCROLL_STEP : d.y > window.innerHeight - EDGE_ZONE ? SCROLL_STEP : 0;
        if (dy !== 0) {
            window.scrollBy(0, dy);
            syncOver(d);
        }
        d.raf = requestAnimationFrame(tick);
    }

    function startDrag(d: ActiveDrag) {
        d.timer = null;
        const rect = d.source.getBoundingClientRect();
        d.offsetX = d.startX - rect.left;
        d.offsetY = d.startY - rect.top;

        const ghost = d.source.cloneNode(true) as HTMLElement;
        Object.assign(ghost.style, {
            position: "fixed",
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            margin: "0",
            transform: "none",
            outline: "none",
            pointerEvents: "none",
            zIndex: "2000",
            opacity: "0.9",
        });
        document.body.appendChild(ghost);
        d.ghost = ghost;
        
        window.addEventListener("touchmove", blockScroll, { passive: false });
        navigator.vibrate?.(15);
        latest.current.onStart(d.appearanceId);
        syncOver(d);
        d.raf = requestAnimationFrame(tick);
    }

    function finish(drop: boolean) {
        const d = drag.current;
        if (!d) return;
        drag.current = null;
        if (d.timer !== null) clearTimeout(d.timer);
        if (d.raf !== null) cancelAnimationFrame(d.raf);
        if (!d.ghost) return;

        d.ghost.remove();
        window.removeEventListener("touchmove", blockScroll);

        clickBlocked.current = true;
        setTimeout(() => { clickBlocked.current = false; }, 400);

        const key = dropKeyAt(d.x, d.y);
        if (drop && key) latest.current.onDrop(key);
        else latest.current.onEnd();
    }

    function bind(appearanceId: number) {
        if (!enabled) return {};
        return {
            onPointerDown(e: React.PointerEvent<HTMLElement>) {
                if (e.pointerType !== "touch" || drag.current) return;
                const d: ActiveDrag = {
                    pointerId: e.pointerId,
                    appearanceId,
                    source: e.currentTarget,
                    startX: e.clientX,
                    startY: e.clientY,
                    x: e.clientX,
                    y: e.clientY,
                    offsetX: 0,
                    offsetY: 0,
                    ghost: null,
                    timer: null,
                    raf: null,
                    overKey: null,
                };
                d.timer = window.setTimeout(() => startDrag(d), HOLD_MS);
                drag.current = d;
            },
            onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
                const d = drag.current;
                if (!d || e.pointerId !== d.pointerId) return;
                d.x = e.clientX;
                d.y = e.clientY;
                if (!d.ghost) {
                    if (Math.hypot(d.x - d.startX, d.y - d.startY) > CANCEL_DISTANCE) finish(false);
                    return;
                }
                d.ghost.style.left = `${d.x - d.offsetX}px`;
                d.ghost.style.top = `${d.y - d.offsetY}px`;
                syncOver(d);
            },
            onPointerUp: (e: React.PointerEvent<HTMLElement>) => {
                if (drag.current?.pointerId === e.pointerId) finish(true);
            },
            onPointerCancel: (e: React.PointerEvent<HTMLElement>) => {
                if (drag.current?.pointerId === e.pointerId) finish(false);
            },
            onContextMenu: (e: React.MouseEvent<HTMLElement>) => {
                if (drag.current) e.preventDefault();
            },
        };
    }

    function consumeClick(): boolean {
        const blocked = clickBlocked.current;
        clickBlocked.current = false;
        return blocked;
    }

    return { bind, consumeClick };
}