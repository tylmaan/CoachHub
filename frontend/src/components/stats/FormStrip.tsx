import { Box, Paper, Tooltip, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import type { TeamMatchResult } from "../../types/teamStats";

interface FormStripProps {
    results: TeamMatchResult[];
}

export function FormStrip({ results }: FormStripProps) {
    const theme = useTheme();
    
    function outcomeOf(r: TeamMatchResult) {
        if (r.scoreFor > r.scoreAgainst) return { letter: "W", color: theme.palette.success.main };
        if (r.scoreFor < r.scoreAgainst) return { letter: "P", color: theme.palette.error.main };
        return { letter: "R", color: theme.palette.grey[600] };
    }

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Forma: ostatnie mecze</Typography>
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {results.map((r) => {
                    const { letter, color } = outcomeOf(r);
                    return (
                        <Tooltip key={r.matchId} title={`${r.opponent} (${r.scoreFor}:${r.scoreAgainst}${r.isHome === null ? "" : r.isHome ? " (dom)" : " (wyjazd)"})`}>
                            <Box
                                component={RouterLink}
                                to={`/matches/${r.matchId}`}
                                sx={{
                                    width: 28, height: 28, borderRadius: 1, bgcolor: color, color: "#fff",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 13, fontWeight: 500, textDecoration: "none",
                                }}
                            >
                                {letter}
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: "block", mt: 1 }}>
                Najnowszy po prawej. Kliknij, aby zobaczyć mecz.
            </Typography>
        </Paper>
    );
}