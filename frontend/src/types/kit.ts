export const KIT_PATTERNS = [
    "Solid",
    "VerticalStripes",
    "HorizontalStripes",
    "Halves",
    "Sash",
    "Quarters"
] as const;

export type KitPattern = (typeof KIT_PATTERNS)[number];

export interface Kit {
    pattern: KitPattern;
    primaryColor: string;
    secondaryColor: string;
}

export interface TeamKits {
    homeKit: Kit;
    awayKit: Kit;
    goalkeeperKit: Kit;
}

export const DEFAULT_KITS: TeamKits = {
    homeKit: { pattern: "Solid", primaryColor: "#7c3aed", secondaryColor: "#ffffff" },
    awayKit: { pattern: "Solid", primaryColor: "#ffffff", secondaryColor: "#7c3aed" },
    goalkeeperKit: { pattern: "Solid", primaryColor: "#16a34a", secondaryColor: "#ffffff" }
};

export const KIT_PATTERN_LABELS: Record<KitPattern, string> = {
    Solid: "Jednolita",
    VerticalStripes: "Paski pionowe",
    HorizontalStripes: "Paski poziome",
    Halves: "Połówki",
    Sash: "Szarfa",
    Quarters: "Ćwiartki"
};