import { Paper, Typography, Box, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

interface LeaguePointsChartProps {
    points: number[];
}

export function LeaguePointsChart({ points }: LeaguePointsChartProps) {
    const theme = useTheme();

    return (
        <Paper sx={{ p: 2, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Punkty w lidze: {points[points.length - 1] ?? 0} pkt po {points.length} kolejkach
            </Typography>
            <Box sx={{ flex: 1, minHeight: 260 }}>
                <LineChart
                xAxis={[{ data: points.map((_, i) => i + 1), label: "Kolejka" }]}
                series={[{ data: points, label: "Punkty", showMark: false, color: theme.palette.primary.main }]}
                grid={{ horizontal: true }}
                hideLegend
            />
            </Box>
        </Paper>
    );
}