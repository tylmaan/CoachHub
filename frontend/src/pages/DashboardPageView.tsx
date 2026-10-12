import { Box, Typography, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export interface Tile {
    label: string;
    path: string;
    icon: React.ReactNode;
}

interface DashboardPageViewProps {
    tiles: Tile[];
}

export function DashboardPageView({ tiles }: DashboardPageViewProps) {
    return (
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
    );
}