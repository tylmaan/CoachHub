import { Box, Typography, Paper, Avatar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import type { TeamSummary } from '../types/team';
import { BACKEND_ORIGIN } from '../api/axiosInstance';

export interface Tile {
    label: string;
    path: string;
    icon: React.ReactNode;
}

interface DashboardPageViewProps {
    tiles: Tile[];
    team: TeamSummary | null;
}

export function DashboardPageView({ tiles, team }: DashboardPageViewProps) {
    return (
        <Box>
            {team && (
                <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {team.logoUrl ? (
                        <Avatar src={`${BACKEND_ORIGIN}${team.logoUrl}`} variant="rounded" sx={{ width: 52, height: 52 }} />
                    ) : (
                        <Avatar variant="rounded" sx={{ width: 52, height: 52 }}>{team.name[0]}</Avatar>
                    )}
                    <Typography variant="h6">{team.name}</Typography>
                </Paper>
            )}

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: 2,
                }}
            >
                {tiles.map((tile) => (
                    <Paper
                        key={tile.path}
                        component={RouterLink}
                        to={tile.path}
                        sx={{
                            p: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            textDecoration: 'none',
                            color: 'inherit',
                            "&:hover": { backgroundColor: 'action.hover' },
                        }}
                    >
                        {tile.icon}
                        <Typography variant="subtitle1">{tile.label}</Typography>
                    </Paper>
                ))}
            </Box>
        </Box>
    );
}