import { Paper, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import type { SeasonSummary } from "../../types/teamStats";

interface HomeAwayChartProps {
    home: SeasonSummary;
    away: SeasonSummary;
}

export function HomeAwayChart({ home, away }: HomeAwayChartProps) {
    const theme = useTheme();

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Dom / Wyjazd</Typography>
            <BarChart
                layout="horizontal"
                height={200}
                yAxis={[{ scaleType: "band", data: ["Domowe", "Wyjazdowe"], width: 100 }]}
                series={[
                    { data: [home.wins, away.wins], label: "Wygrane", stack: "total", color: theme.palette.success.main },
                    { data: [home.draws, away.draws], label: "Remisy", stack: "total", color: theme.palette.grey[600] },
                    { data: [home.losses, away.losses], label: "Przegrane", stack: "total", color: theme.palette.error.main },
                ]}
            />
        </Paper>
    );
}