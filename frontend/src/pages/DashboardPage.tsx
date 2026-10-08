import { Box, Typography, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SportsSoccerOutlinedIcon from '@mui/icons-material/SportsSoccerOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';

interface Tile {
    label: string;
    path: string;
    icon: React.ReactNode;
}

export function DashboardPage() {
    const { roles } = useAuth();
    const isAdmin = roles?.includes('Admin');

    const tiles: Tile[] = [
        { label: 'Drużyny', path: '/teams', icon: <ShieldOutlinedIcon sx={{ fontSize: 32 }} /> },
        ...(isAdmin ? [{ label: 'Użytkownicy', path: '/users', icon: <ManageAccountsOutlinedIcon sx={{ fontSize: 32 }} /> }] 
            : [
                { label: 'Zawodnicy', path: '/players', icon: <GroupsOutlinedIcon sx={{ fontSize: 32 }} /> },
                { label: 'Mecze', path: '/matches', icon: <SportsSoccerOutlinedIcon sx={{ fontSize: 32 }} /> },
            ]),
    ];

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