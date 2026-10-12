import { Box, Button, TextField, Typography, Alert } from '@mui/material';

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
            <Typography variant="h5">Logowanie</Typography>
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