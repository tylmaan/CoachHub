import { Paper, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";

const PERIOD_LABELS = ["0-15", "16-30", "31-45", "46-60", "61-75", "76-90", "Dogrywka"];

interface GoalsByPeriodChartProps {
    scored: number[];
    conceded: number[];
}

export function GoalsByPeriodChart({ scored, conceded }: GoalsByPeriodChartProps) {
    const theme = useTheme();
    const periods = scored[6] + conceded[6] > 0 ? 7 : 6;

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Bramki w czasie gry</Typography>
            <BarChart
                height={260}
                xAxis={[{ scaleType: "band", data: PERIOD_LABELS.slice(0, periods) }]}
                series={[
                    { data: scored.slice(0, periods), label: "Strzelone", color: theme.palette.primary.main },
                    { data: conceded.slice(0, periods), label: "Stracone", color: theme.palette.grey[500] },
                ]}
                grid={{ horizontal: true }}
            />
        </Paper>
    );
}