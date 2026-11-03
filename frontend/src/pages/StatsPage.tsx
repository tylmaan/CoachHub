import { useEffect, useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import { getTeamStats } from "../api/teamStatsApi";
import type { SeasonSummary, TeamSeasonStats, TeamMatchResult } from "../types/teamStats";
import { StatsPageView } from "./StatsPageView";

function summarize(results: TeamMatchResult[]): SeasonSummary {
    return {
        matches: results.length,
        wins: results.filter(r => r.scoreFor > r.scoreAgainst).length,
        draws: results.filter(r => r.scoreFor === r.scoreAgainst).length,
        losses: results.filter(r => r.scoreFor < r.scoreAgainst).length,
        goalsFor: results.reduce((sum, r) => sum + r.scoreFor, 0),
        goalsAgainst: results.reduce((sum, r) => sum + r.scoreAgainst, 0),
        cleanSheets: results.filter(r => r.scoreAgainst === 0).length,
    };
}

export function StatsPage() {
    const [stats, setStats] = useState<TeamSeasonStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [season, setSeason] = useState("");

    useEffect(() => {
        getTeamStats()
            .then((data) => {
                setStats(data);
                setSeason(data[0]?.season ?? "");
            })
            .catch(() => setError("Nie udało się pobrać statystyk"))
            .finally(() => setLoading(false));
    }, []);

    const seasons = stats.map(s => s.season);
    const current = stats.find(s => s.season === season) ?? null;
    const summary = current ? summarize(current.results) : null;

    const recentResults = current ? current.results.slice(-10) : [];
    const leaguePoints = current ? current.results
        .filter((r) => r.matchType === "League")
        .reduce<number[]>((points, r) => {
            const earned = r.scoreFor > r.scoreAgainst ? 3 : r.scoreFor === r.scoreAgainst ? 1 : 0;
            return [...points, (points[points.length - 1] ?? 0) + earned];
        }, []) 
    : [];
    const homeSummary = summarize(current?.results.filter(r => r.isHome === true) ?? []);
    const awaySummary = summarize(current?.results.filter(r => r.isHome === false) ?? []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <StatsPageView
            seasons={seasons}
            season={season}
            onSeasonChange={setSeason}
            current={current}
            summary={summary}
            recentResults={recentResults}
            leaguePoints={leaguePoints}
            homeSummary={homeSummary}
            awaySummary={awaySummary}
        />
    );
}