import { Box, Typography, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
    const { email, roles, logout } = useAuth();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4"> Witaj, {email}!</Typography>
            <Typography variant="body1">Role: {roles?.join(', ')}</Typography>
            <Button variant="outlined" onClick={logout} sx={{ mt: 2 }}>
                Wyloguj się
            </Button>
        </Box>
    );
} 