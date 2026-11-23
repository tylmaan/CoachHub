import { Link as RouterLink } from 'react-router-dom';
import { 
    Avatar,
    Box,
    Chip,
    Paper,
    Typography
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BACKEND_ORIGIN } from '../../api/axiosInstance';
import type { Match } from '../../types/match';
import {
    countdownLabel,
    daysUntil,
    matchTypeLabel,
    parseMatchDate,
    roundLabel
} from '../../types/matchSchedule';

interface NextMatchesStripProps {
    matches: Match[];
    teamLeague: string | null;
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function NextMatchesStrip({ 
    matches, 
    teamLeague 
}: NextMatchesStripProps) {
    const now = new Date();
    const weekday = now.toLocaleDateString('pl-PL', { weekday: 'long' });
    const fullDate = now.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Box sx={{ display: "flex", gap: 2, alignItems: "stretch", mb: 3 }}>
            <Box sx={{ width: 150, flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Typography variant="caption" color="text.secondary">Dziś</Typography>
                <Typography variant="h6">{weekday}</Typography>
                <Typography variant="body2" color="text.secondary">{fullDate}</Typography>
            </Box>

            {matches.length > 0 && (
                <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 2 }}>
                    {matches.map((match, index) => {
                        const isNext = index === 0;
                        const round = roundLabel(match);
                        const matchDay = parseMatchDate(match.date).toLocaleDateString("pl-PL", {
                            weekday: "long",
                            day: "numeric",
                            month: "short",
                        });

                        return (
                            <Paper
                                key={match.id}
                                component={RouterLink}
                                to={`/matches/${match.id}`}
                                sx={{
                                    p: 1.5,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 0.75,
                                    textDecoration: "none",
                                    color: "inherit",
                                    border: isNext ? "2px solid" : "1px solid",
                                    borderColor: isNext ? "primary.main" : "divider",
                                    "&:hover": { backgroundColor: "action.hover" },
                                }}
                            >
                                <Chip
                                    size="small"
                                    color={isNext ? "primary" : "default"}
                                    variant={isNext ? "filled" : "outlined"}
                                    label={capitalize(countdownLabel(daysUntil(match.date)))}
                                    sx={{ alignSelf: "flex-start" }}
                                />

                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                                    {match.opponentLogoUrl ? (
                                        <Avatar
                                            src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`}
                                            variant="rounded"
                                            sx={{ width: 28, height: 28 }}
                                        />
                                    ) : (
                                        <Avatar variant="rounded" sx={{ width: 28, height: 28 }}>
                                            {match.opponent[0]}
                                        </Avatar>
                                    )}
                                    <Typography noWrap sx={{ fontWeight: 600 }}>{match.opponent}</Typography>
                                </Box>

                                <Typography variant="body2" color="text.secondary">
                                    {matchTypeLabel(match, teamLeague)}{round && ` · ${round}`}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {matchDay}{match.isHome !== null && ` · ${match.isHome ? "Dom" : "Wyjazd"}`}
                                </Typography>

                                {isNext && (
                                    <Typography
                                        variant="caption"
                                        color="primary"
                                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                                    >
                                        Planuj mecz <ArrowForwardIcon sx={{ fontSize: 14 }} />
                                    </Typography>
                                )}
                            </Paper>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}