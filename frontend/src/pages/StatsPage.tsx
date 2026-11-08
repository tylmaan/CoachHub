import { useEffect, useState } from "react";
import { usePersistentState } from "../hooks/usePersistentState";
import { Alert, CircularProgress } from "@mui/material";
import { getTeamStats } from "../api/teamStatsApi";
import { getPlayerStats } from "../api/playerStatsApi";
import type { PlayerSeasonStats } from "../types/playerStats";
import type { SeasonSummary, TeamSeasonStats, TeamMatchResult, RankingRow, MinutesMetric, RankingMetric } from "../types/teamStats";
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

function topPlayers(
    stats: PlayerSeasonStats[],
    season: string,
    metric: MinutesMetric | RankingMetric,
    limit: number
): RankingRow[] {
    return stats
        .filter(s => s.season === season && s[metric] > 0)
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, limit)
        .map(s => ({ name: s.lastName.trim(), value: s[metric] }));
}

export function StatsPage() {
    const [stats, setStats] = useState<TeamSeasonStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = usePersistentState("stats.season", "");
    const [playerStats, setPlayerStats] = useState<PlayerSeasonStats[]>([]);
    const [minutesMetric, setMinutesMetric] = usePersistentState<MinutesMetric>("stats.minutesMetric", "minutes");
    const [rankingMetric, setRankingMetric] = usePersistentState<RankingMetric>("stats.rankingMetric", "goals");

    useEffect(() => {
        Promise.all([getTeamStats(), getPlayerStats()])
            .then(([teamData, playerData]) => {
                setStats(teamData);
                setPlayerStats(playerData);
            })
            .catch(() => setError("Nie udało się pobrać statystyk"))
            .finally(() => setLoading(false));
    }, []);

    const seasons = stats.map(s => s.season);
    const season = seasons.includes(selectedSeason) ? selectedSeason : (seasons[0] || "");
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
    const minutesRows = topPlayers(playerStats, season, minutesMetric, 8);
    const rankingRows = topPlayers(playerStats, season, rankingMetric, 8);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <StatsPageView
            seasons={seasons}
            season={season}
            onSeasonChange={setSelectedSeason}
            current={current}
            summary={summary}
            recentResults={recentResults}
            leaguePoints={leaguePoints}
            homeSummary={homeSummary}
            awaySummary={awaySummary}
            minutesMetric={minutesMetric}
            onMinutesMetricChange={setMinutesMetric}
            minutesRows={minutesRows}
            rankingMetric={rankingMetric}
            onRankingMetricChange={setRankingMetric}
            rankingRows={rankingRows}
        />
    );
}