import { Paper, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";

interface LeaguePointsChartProps {
    points: number[];
}

export function LeaguePointsChart({ points }: LeaguePointsChartProps) {
    const theme = useTheme();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Punkty w lidze: {points[points.length - 1] ?? 0} pkt po {points.length} kolejkach
            </Typography>
            <LineChart
                height={260}
                xAxis={[{ data: points.map((_, i) => i + 1), label: "Kolejka" }]}
                series={[{ data: points, label: "Punkty", showMark: false, color: theme.palette.primary.main }]}
                grid={{ horizontal: true }}
                hideLegend
            />
        </Paper>
    );
}