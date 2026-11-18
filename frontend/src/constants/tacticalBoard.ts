import type { BoardArrow, BoardObject, BoardSide } from "../types/tacticalBoard";

export const SIDE_COLORS: Record<BoardSide, { fill: string; arrow: string }> = {
    own: { fill: "#7c3aed", arrow: "#ddd6fe" },
    opponent: { fill: "#dc2626", arrow: "#fecaca" },
};

export const SIDE_LABELS: Record<BoardSide, string> = {
    own: "Nasz",
    opponent: "Rywal"
};

export const ARROW_STYLE_LABELS: Record<BoardArrow["style"], string> = {
    run: "Bieg",
    pass: "Podanie",
};

export const OBJECT_LABELS: Record<BoardObject["type"], string> = {
    player: "Zawodnik",
    zone: "Strefa",
    arrow: "Strzałka",
    text: "Tekst"
};