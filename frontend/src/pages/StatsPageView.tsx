import {
    Box,
    Button,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { SeasonSummary, TeamMatchResult, TeamSeasonStats, RankingRow, MinutesMetric, RankingMetric } from "../types/teamStats";
import { GoalsByPeriodChart } from "../components/stats/GoalsByPeriodChart";
import { FormStrip } from "../components/stats/FormStrip";
import { LeaguePointsChart } from "../components/stats/LeaguePointsChart";
import { HomeAwayChart } from "../components/stats/HomeAwayChart";
import { PlayerRankingChart } from "../components/stats/PlayerRankingChart";

interface StatsPageViewProps {
    seasons: string[];
    season: string;
    onSeasonChange: (season: string) => void;
    current: TeamSeasonStats | null;
    summary: SeasonSummary | null;
    recentResults: TeamMatchResult[];
    leaguePoints: number[];
    homeSummary: SeasonSummary;
    awaySummary: SeasonSummary;
    minutesMetric: MinutesMetric;
    onMinutesMetricChange: (metric: MinutesMetric) => void;
    minutesRows: RankingRow[];
    rankingMetric: RankingMetric;
    onRankingMetricChange: (metric: RankingMetric) => void;
    rankingRows: RankingRow[];
}

function KpiTile({ label, value, caption }: { label: string; value: string; caption: string }) {
    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="body2" color="textSecondary">{label}</Typography>
            <Typography variant="h5">{value}</Typography>
            <Typography variant="caption" color="textSecondary">{caption}</Typography>
        </Paper>
    );
}

const MINUTES_OPTIONS: { value: MinutesMetric; label: string }[] = [
    { value: "minutes", label: "Minuty" },
    { value: "matches", label: "Mecze" },
];

const RANKING_OPTIONS: { value: RankingMetric; label: string }[] = [
    { value: "goals", label: "Bramki" },
    { value: "assists", label: "Asysty" },
    { value: "yellowCards", label: "Kartki" },
];

export function StatsPageView({ 
    seasons, 
    season, 
    onSeasonChange, 
    current, 
    summary,
    recentResults,
    leaguePoints,
    homeSummary,
    awaySummary,
    minutesMetric,
    onMinutesMetricChange,
    minutesRows,
    rankingMetric,
    onRankingMetricChange,
    rankingRows,
}: StatsPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2 }}>
                <Typography variant="h4">Statystyki</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TextField
                        select
                        size="small"
                        label="Sezon"
                        value={season}
                        onChange={(e) => onSeasonChange(e.target.value)}
                        sx={{ minWidth: 160 }}
                    >
                        {seasons.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </TextField>
                    <Button variant="outlined" component={RouterLink} to="/stats/players">
                        Statystyki zawodników →
                    </Button>
                </Box>
            </Box>

            {!current || !summary ? (
                <Typography color="text.secondary">Brak rozegranych meczów.</Typography>
            ) : (
                <>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                        <KpiTile 
                            label="Mecze"
                            value={String(summary.matches)}
                            caption={`${summary.wins} W · ${summary.draws} R · ${summary.losses} P`}
                        />
                        <KpiTile
                            label="Bramki"
                            value={`${summary.goalsFor}:${summary.goalsAgainst}`}
                            caption={`${summary.goalsFor - summary.goalsAgainst > 0 ? "+" : ""}${summary.goalsFor - summary.goalsAgainst}, ${(summary.goalsFor / summary.matches).toFixed(2).replace(".", ",")} na mecz`}
                        />
                        <KpiTile
                            label="Czyste konta"
                            value={String(summary.cleanSheets)}
                            caption={`${Math.round((summary.cleanSheets / summary.matches) * 100)}% meczów`}
                        />
                        <KpiTile
                            label="Kartki"
                            value={`${current.yellowCards} · ${current.redCards}`}
                            caption="żółte · czerwone"
                        />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <FormStrip results={recentResults} />
                    </Box>
                    {leaguePoints.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                            <LeaguePointsChart points={leaguePoints} />
                        </Box>
                    )}
                    <Box sx={{ mt: 2 }}>
                        <HomeAwayChart home={homeSummary} away={awaySummary} />
                    </Box>
                    <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
                        <PlayerRankingChart
                            title="Minuty zawodników"
                            options={MINUTES_OPTIONS}
                            metric={minutesMetric}
                            onMetricChange={onMinutesMetricChange}
                            rows={minutesRows}
                        />
                        <PlayerRankingChart
                            title="Ranking zawodników"
                            options={RANKING_OPTIONS}
                            metric={rankingMetric}
                            onMetricChange={onRankingMetricChange}
                            rows={rankingRows}
                        />
                    </Box>
                    <Box sx={{ mt: 2 }}>
                        <GoalsByPeriodChart
                            scored={current.goalsScoredByPeriod}
                            conceded={current.goalsConcededByPeriod}
                        />
                    </Box>
                </>
            )}
        </>
    );
}