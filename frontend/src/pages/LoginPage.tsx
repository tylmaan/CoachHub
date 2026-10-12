import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { LoginPageView } from './LoginPageView';

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const { login: loginContext } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e: React.SyntheticEvent) {
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
        <LoginPageView
            email={email}
            password={password}
            error={error}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleSubmit}
        />
    )
}