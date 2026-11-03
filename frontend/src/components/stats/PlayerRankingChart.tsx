import { Box, Paper, ToggleButton, ToggleButtonGroup, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { RankingRow } from "../../types/teamStats";

interface PlayerRankingChartProps <T extends string> {
    title: string;
    options: { value: T, label: string }[];
    metric: T;
    onMetricChange: (metric: T) => void;
    rows: RankingRow[];
}

export function PlayerRankingChart<T extends string>({
    title,
    options,
    metric,
    onMetricChange,
    rows,
}: PlayerRankingChartProps<T>) {
    const theme = useTheme();
    const metricLabel = options.find(o => o.value === metric)?.label ?? "";

    return (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="subtitle1">{title}</Typography>
                <ToggleButtonGroup
                    exclusive
                    size="small"
                    value={metric}
                    onChange={(_, value: T | null) => value && onMetricChange(value)}
                >
                    {options.map((o) => (
                        <ToggleButton key={o.value} value={o.value}>{o.label}</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>
            {rows.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Brak danych w tym sezonie.</Typography>
            ) : (
                <BarChart
                    layout="horizontal"
                    height={rows.length * 36 + 60}
                    yAxis={[{ scaleType: "band", data: rows.map((r) => r.name), width: 100 }]}
                    series={[{ data: rows.map((r) => r.value), label: metricLabel, color: theme.palette.primary.main }]}
                    hideLegend
                />
            )}
        </Paper>
    );
}