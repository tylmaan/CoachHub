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
    Button,
    Avatar
} from '@mui/material';
import axios from "axios";
import { getTeams, createTeam, updateTeam, deleteTeam } from '../api/teamsApi';
import type { Team } from '../types/team';
import { useAuth } from "../context/AuthContext";
import { uploadFile } from '../api/filesApi';
import { BACKEND_ORIGIN } from '../api/axiosInstance';

export function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [foundedDate, setFoundedDate] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editFoundedDate, setEditFoundedDate] = useState("");
    const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const { roles } = useAuth();
    const canEdit = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canDelete = roles?.includes("Coach");

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

    async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setLogoUrl(url);
        } catch {
            setFormError("Nie udało się wgrać logo.");
        }
    }

    async function handleEditLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditLogoUrl(url);
        } catch {
            setActionError("Nie udało się wgrać logo.");
        }
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createTeam({ name, foundedDate, logoUrl });
            setName("");
            setFoundedDate("");
            setLogoUrl(null);
            loadTeams();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć drużyny.");
            }
        }
    }

    function startEdit(team: Team) {
        setEditingId(team.id);
        setEditName(team.name);
        setEditFoundedDate(team.foundedDate);
        setEditLogoUrl(team.logoUrl);
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updateTeam(id, { name: editName, foundedDate: editFoundedDate, logoUrl: editLogoUrl });
            setEditingId(null);
            loadTeams();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deleteTeam(id);
            loadTeams();
        } catch {
            setActionError("Nie udało się usunąć drużyny.")
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
                    {logoUrl && <Avatar src={`${BACKEND_ORIGIN}${logoUrl}`} variant="rounded" />}
                    <Button component="label" variant="outlined">
                        Wybierz logo
                        <input type="file" accept="image/png,image/jpeg" hidden onChange={handleLogoSelect} />
                    </Button>
                    <Button type="submit" variant="contained">
                        Dodaj drużynę
                    </Button>
                </Box>
            )}

            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Logo</TableCell>
                            <TableCell>Nazwa</TableCell>
                            <TableCell>Data założenia</TableCell>
                            {(canEdit || canDelete) && <TableCell>Akcje</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {teams.map((team) => 
                            editingId == team.id ? (
                                <TableRow key={team.id}>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {editLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${editLogoUrl}`} variant="rounded" />}
                                            <Button component="label" size="small">
                                                Zmień
                                                <input type="file" accept="image/png,image/jpeg" hidden onChange={handleEditLogoSelect} />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editName} 
                                            onChange={(e) => setEditName(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            type="date" 
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={editFoundedDate}
                                            onChange={(e) => setEditFoundedDate(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="contained" onClick={() => saveEdit(team.id)}>Zapisz</Button>
                                            <Button size="small" onClick={() => setEditingId(null)}>Anuluj</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={team.id}>
                                    <TableCell>
                                        {team.logoUrl ? (
                                            <Avatar src={`${BACKEND_ORIGIN}${team.logoUrl}`} variant="rounded" />
                                        ) : (
                                            <Avatar variant="rounded">{team.name[0]}</Avatar>
                                        )}
                                    </TableCell>
                                    <TableCell>{team.name}</TableCell>
                                    <TableCell>{team.foundedDate}</TableCell>
                                    {(canEdit || canDelete) && (
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1}}>
                                                {canEdit && <Button size="small" onClick={() => startEdit(team)}>Edytuj</Button>}
                                                {canDelete && <Button size="small" color="error" onClick={() => handleDelete(team.id)}>Usuń</Button>}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}