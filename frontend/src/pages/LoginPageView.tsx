import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { Logo } from '../components/Logo';

interface LoginPageViewProps {
    email: string;
    password: string;
    error: string | null;
    onEmailChange: (value: string) => void;
    onPasswordChange: (value: string) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
}

export function LoginPageView({ 
    email,
    password,
    error,
    onEmailChange,
    onPasswordChange,
    onSubmit
}: LoginPageViewProps) {
    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{ maxWidth: 360, mx: 'auto', mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Logo size={96} />
                <Typography variant="h3" component="h1" sx={{ fontWeight: 800, letterSpacing: '-1px' }}>
                    Coach<Box component="span" sx={{ color: 'primary.light' }}>Hub</Box>
                </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                required
            />
            <TextField
                label="Hasło"
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                required
            />
            <Button type="submit" variant="contained">
                Zaloguj się
            </Button>
        </Box>
    );
}