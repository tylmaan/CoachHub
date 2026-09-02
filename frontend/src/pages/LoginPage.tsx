import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { login: loginContext } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        try {
            const auth = await login({ email, password });
            loginContext(auth);
            navigate("/");
        } catch {
            setError("Nieprawidłowy email lub hasło");
        }
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ maxWidth: 360, mx: 'auto', mt: 8, display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            <Typography variant="h5">Logowanie</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <TextField
                label="Hasło"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <Button type="submit" variant="contained">
                Zaloguj się
            </Button>
        </Box>
    );
}