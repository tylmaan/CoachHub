export const LEAGUES: Record<string, string[]> = {
    gb: ["Premier League", "Championship", "League One", "League Two"],
    pl: ["Ekstraklasa", "I Liga", "II Liga", "III Liga"],
};

export function leaguesOf(countryCode: string | null): string[] {
    return countryCode ? (LEAGUES[countryCode] ?? []) : [];
}