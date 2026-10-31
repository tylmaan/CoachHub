import { COUNTRIES } from "./countries";

export type CompetitionCategory = "league" | "cup" | "international" | "friendly";

export interface Competition {
    name: string;
    country: string | null;
    category: "cup" | "international";
}

export interface CompetitionGroup {
    key: string;
    label: string;
    category: "cup" | "international";
    names: string[];
}

export const COMPETITIONS: Competition[] = [
    { name: "Puchar Polski", country: "pl", category: "cup" },
    { name: "Superpuchar Polski", country: "pl", category: "cup" },
    { name: "FA Cup", country: "gb", category: "cup" },
    { name: "EFL Cup", country: "gb", category: "cup" },
    { name: "Liga Mistrzów", country: null, category: "international" },
    { name: "Liga Europy", country: null, category: "international" },
    { name: "Liga Konferencji Europy", country: null, category: "international" },
];

export const CATEGORY_LABELS: Record<CompetitionCategory, string> = {
    league: "Ligowy",
    cup: "Pucharowy",
    international: "Puchar Międzynarodowy",
    friendly: "Towarzyski",
};

export const CATEGORY_COLORS: Record<CompetitionCategory, { bg: string; fg: string; bar: string }> = {
    league: { bg: "#E6F1FB", fg: "#0C447C", bar: "#378ADD" },
    cup: { bg: "#FAEEDA", fg: "#633806", bar: "#BA7517" },
    international: { bg: "#EEEDFE", fg: "#3C3489", bar: "#7F77DD" },
    friendly: { bg: "#F1EFE8", fg: "#444441", bar: "#B4B2A9" },
}

export function categoryOfMatch(matchType: string | null, competition: string | null): CompetitionCategory {
    if (matchType === "League") return "league";
    if (matchType === "Friendly") return "friendly";
    const found = COMPETITIONS.find((c) => c.name === competition);
    return found ? found.category : "cup";
}

export function groupCompetitions(countryCode: string | null): CompetitionGroup[] {
    const countries = [...new Set(COMPETITIONS.map((c) => c.country).filter((c): c is string => c !== null))];
    const shown = countryCode ? countries.filter((c) => c === countryCode) : countries;

    const groups: CompetitionGroup[] = shown.map((code) => ({
        key: code,
        label: COUNTRIES.find((c) => c.code === code)?.name || code,
        category: "cup",
        names: COMPETITIONS.filter((c) => c.country === code).map((c) => c.name),
    }));

    groups.push({
        key: "international",
        label: "Międzynarodowe",
        category: "international",
        names: COMPETITIONS.filter((c) => c.country === null).map((c) => c.name),
    });

    return groups;
}