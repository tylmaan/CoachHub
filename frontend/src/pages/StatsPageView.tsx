import {
    Box,
    Button,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { SeasonSummary, TeamSeasonStats } from "../types/teamStats";

interface StatsPageViewProps {
    seasons: string[];
    season: string;
    onSeasonChange: (season: string) => void;
    current: TeamSeasonStats | null;
    summary: SeasonSummary | null;
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

export function StatsPageView({ 
    seasons, 
    season, 
    onSeasonChange, 
    current, 
    summary
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
            )}
        </>
    );
}