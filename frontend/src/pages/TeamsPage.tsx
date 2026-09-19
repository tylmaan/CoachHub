import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Box,
    TextField,
    Button
} from '@mui/material';
import axios from "axios";
import { getTeams, createTeam } from '../api/teamsApi';
import type { Team } from '../types/team';
import { useAuth } from "../context/AuthContext";

export function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [foundedDate, setFoundedDate] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const { roles } = useAuth();

    function loadTeams() {
        setLoading(true);
        getTeams()
            .then(setTeams)
            .catch(() => setError("Nie udało się pobrać drużyn"))
            .finally(() => setLoading(false));
    }
    
    useEffect(() => {
        loadTeams();
    }, []);

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createTeam({ name, foundedDate });
            setName("");
            setFoundedDate("");
            loadTeams();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć drużyny.");
            }
        }
    }

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Drużyny
            </Typography>

            {roles?.includes("Admin") && (
                <Box
                    component="form"
                    onSubmit={handleCreate}
                    sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start" }}
                >
                    {formError && <Alert severity="error">{formError}</Alert>}
                    <TextField
                        label="Nazwa"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <TextField
                        label="Data założenia"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={foundedDate}
                        onChange={(e) => setFoundedDate(e.target.value)}
                        required
                    />
                    <Button type="submit" variant="contained">
                        Dodaj drużynę
                    </Button>
                </Box>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nazwa</TableCell>
                            <TableCell>Data założenia</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teams.map((team) => (
                            <TableRow key={team.id}>
                                <TableCell>{team.name}</TableCell>
                                <TableCell>{team.foundedDate}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}