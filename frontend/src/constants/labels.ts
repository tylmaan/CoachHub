export const ROLE_LABELS: Record<string, string> = {
    Admin: "Administrator",
    Coach: "Trener",
    AssistantCoach: "Asystent trenera",
    Analyst: "Analityk",
};

export const FOOT_LABELS: Record<string, string> = {
    Left: "Lewa",
    Right: "Prawa",
    Both: "Obie",
};

export const MATCH_TYPE_LABELS: Record<string, string> = {
    League: "Ligowy",
    Cup: "Pucharowy",
    Friendly: "Towarzyski",
};

export const COMPETITIONS = [
    "Superpuchar Polski",
    "Puchar Polski",
    "Liga Mistrzów",
    "Liga Europy",
    "Liga Konferencji Europy",
];

export const POSITION_LABELS: Record<string, string> = {
    GK: "Bramkarz",
    CB: "Środkowy obrońca",
    LB: "Lewy obrońca",
    RB: "Prawy obrońca",
    LWB: "Lewy wahadłowy",
    RWB: "Prawy wahadłowy",
    CDM: "Defensywny pomocnik",
    CM: "Środkowy pomocnik",
    CAM: "Ofensywny pomocnik",
    LM: "Lewy pomocnik",
    RM: "Prawy pomocnik",
    LW: "Lewy skrzydłowy",
    RW: "Prawy skrzydłowy",
    CF: "Środkowy napastnik",
    ST: "Napastnik",
};

export const POSITIONS = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "CF", "ST"];

export const POSITION_GROUPS: { label: string; codes: string[] }[] = [
    { label: "Bramkarze", codes: ["GK"] },
    { label: "Obrońcy", codes: ["LB", "CB", "RB", "LWB", "RWB"] },
    { label: "Pomocnicy", codes: ["CDM", "CM", "CAM", "LM", "RM"] },
    { label: "Napastnicy", codes: ["LW", "RW", "CF", "ST"] },
];

export const EVENT_TYPE_LABELS: Record<string, string> = {
    Goal: "Gol",
    OwnGoal: "Samobój",
    Assist: "Asysta",
    YellowCard: "Żółta kartka",
    RedCard: "Czerwona kartka",
    Substitution: "Zmiana",
    SubstitutionIn: "Zmiana - wchodzi",
    SubstitutionOff: "Zmiana - schodzi",
    PenaltyGoal: "Gol z rzutu karnego",
    PenaltyMissed: "Niewykorzystany rzut karny",
};