import { Box, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
    const { email, roles } = useAuth();

    return (
        <Box sx={{ p: 4 }}>
            <Typography variant="h4"> Witaj, {email}!</Typography>
            <Typography variant="body1">Role: {roles?.join(', ')}</Typography>
        </Box>
    );
} 