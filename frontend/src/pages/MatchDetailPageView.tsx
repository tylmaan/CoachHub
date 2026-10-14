import { Box, Typography, Avatar, Paper } from "@mui/material";
import type { Match } from "../types/match";
import { MATCH_TYPE_LABELS } from "../constants/labels";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

interface MatchDetailPageViewProps {
    match: Match;
}

export function MatchDetailPageView({ match }: MatchDetailPageViewProps) {
    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                {match.opponentLogoUrl ? (
                    <Avatar src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`} variant="rounded" sx={{ width: 56, height: 56 }} />
                ) : (
                    <Avatar variant="rounded" sx={{ width: 56, height: 56 }}>{match.opponent[0]}</Avatar>
                )}
                <Box>
                    <Typography variant="h5">{match.opponent}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {match.date} &middot; {match.season}
                        {match.matchType && ` · ${MATCH_TYPE_LABELS[match.matchType] ?? match.matchType}`}
                        {match.round && ` · ${match.round}`}
                        {match.isHome !== null && ` · ${match.isHome ? "Dom" : "Wyjazd"}`}
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="h4">
                    {match.scoreFor ?? "-"} : {match.scoreAgainst ?? "-"}
                </Typography>
            </Paper>
        </Box>
    );
}