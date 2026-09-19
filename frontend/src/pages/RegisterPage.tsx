import { useEffect, useState } from "react";
import {
    Box,
    Button,
    TextField,
    Typography,
    Alert,
    MenuItem
} from "@mui/material";
import { register } from "../api/authApi";
import { getTeams } from "../api/teamsApi";
import type { Team } from "../types/team";
import axios from "axios";

const ROLES = ["Admin", "Coach", "AssistantCoach", "Analyst"];

export function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Coach");
    const [teamId, setTeamId] = useState<number | "">("");
    const [teams, setTeams] = useState<Team[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        getTeams().then(setTeams).catch(() => {});
    }, []);

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        try {
            await register({
                email,
                password,
                role,
                teamId: role === "Admin" ? null : (teamId as number),
            });
            setSuccess(`Konto ${email} utworzone pomyślnie.`);
            setEmail("");
            setPassword("");
            setTeamId("");
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setError(err.response.data.join(" "));
            } else {
                setError("Nie udało się utworzyć konta - sprawdź dane i spróbuj ponownie.")
            }
        }
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ maxWidth: 400, display: "flex", flexDirection: "column", gap: 2}}
        >
            <Typography variant="h4">Nowe konto</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
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
            <TextField
                select
                label="Rola"
                value={role}
                onChange={(e) => setRole(e.target.value)}    
            >
                {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                        {r}
                    </MenuItem>
                ))}
            </TextField>
            {role !== "Admin" && (
                <TextField
                    select
                    label="Drużyna"
                    value={teamId}
                    onChange={(e) => setTeamId(Number(e.target.value))}
                    required
                >
                    {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                            {team.name}
                        </MenuItem>
                    ))}
                </TextField>
            )}
            <Button type="submit" variant="contained">
                Utwórz konto
            </Button>
        </Box>
    );
}