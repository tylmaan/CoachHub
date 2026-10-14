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

export const EVENT_TYPE_LABELS: Record<string, string> = {
    Goal: "Gol",
    OwnGoal: "Samobój",
    Assist: "Asysta",
    YellowCard: "Żółta kartka",
    RedCard: "Czerwona kartka",
    SubstitutionIn: "Zmiana - wchodzi",
    SubstitutionOff: "Zmiana - schodzi",
    PenaltyMissed: "Niewykorzystany rzut karny",
};