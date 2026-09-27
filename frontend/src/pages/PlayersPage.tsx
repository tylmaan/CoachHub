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
    MenuItem,
} from '@mui/material';
import axios from "axios";
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../api/playersApi';
import type { Player } from '../types/player';
import { useAuth } from "../context/AuthContext";
import { FOOT_LABELS } from '../constants/labels';

const FEET = ["Left", "Right", "Both"];

function toNullableNumber(value: string): number | null {
    return value === "" ? null : Number(value);
}

export function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [position, setPosition] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [weightKg, setWeightKg] = useState("");
    const [jerseyNumber, setJerseyNumber] = useState("");
    const [preferredFoot, setPreferredFoot] = useState("");
    const [formError, setFormError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editDateOfBirth, setEditDateOfBirth] = useState("");
    const [editPosition, setEditPosition] = useState("");
    const [editHeightCm, setEditHeightCm] =useState("");
    const [editWeightKg, setEditWeightKg] =useState("");
    const [editJerseyNumber, setEditJerseyNumber] = useState("");
    const [editPreferredFoot, setEditPreferredFoot] =useState("");
    const [actionError, setActionError] = useState<string | null>(null);

    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");

    function loadPlayers() {
        setLoading(true);
        getPlayers()
            .then(setPlayers)
            .catch(() => setError("Nie udało się pobrać zawodników."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadPlayers();
    }, []);

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createPlayer({
                firstName,
                lastName,
                dateOfBirth,
                position,
                teamId: teamId as number,
                heightCm : toNullableNumber(heightCm),
                weightKg: toNullableNumber(weightKg),
                jerseyNumber: toNullableNumber(jerseyNumber),
                preferredFoot: preferredFoot || null,
            });
            setFirstName("");
            setLastName("");
            setDateOfBirth("");
            setPosition("");
            setHeightCm("");
            setWeightKg("");
            setJerseyNumber("");
            setPreferredFoot("");
            loadPlayers();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się dodać zawodnika.")
            }
        }
    }

    function startEdit(player: Player) {
        setEditingId(player.id);
        setEditFirstName(player.firstName);
        setEditLastName(player.lastName);
        setEditDateOfBirth(player.dateOfBirth);
        setEditPosition(player.position);
        setEditHeightCm(player.heightCm?.toString() ?? "");
        setEditWeightKg(player.weightKg?.toString() ?? "");
        setEditJerseyNumber(player.jerseyNumber?.toString() ?? "");
        setEditPreferredFoot(player.preferredFoot ?? "");
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updatePlayer(id, {
                firstName: editFirstName,
                lastName: editLastName,
                dateOfBirth: editDateOfBirth,
                position: editPosition,
                teamId: teamId as number,
                heightCm: toNullableNumber(editHeightCm),
                weightKg: toNullableNumber(editWeightKg),
                jerseyNumber: toNullableNumber(editJerseyNumber),
                preferredFoot: editPreferredFoot || null,
            });
            setEditingId(null);
            loadPlayers();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deletePlayer(id);
            loadPlayers();
        } catch {
            setActionError("Nie udało się usunąć zawodnika.")
        }
    }

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Zawodnicy
            </Typography>

            {canCreate && (
                <Box
                    component="form"
                    onSubmit={handleCreate}
                    sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}
                >
                    {formError && <Alert severity="error">{formError}</Alert>}
                    <TextField
                        label="Imię"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                    <TextField
                        label="Nazwisko"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                    <TextField
                        label="Data urodzenia"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                    />
                    <TextField
                        label="Pozycja"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        required
                    />
                    <TextField
                        label="Wzrost (cm)"
                        type="number"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                    />
                    <TextField
                        label="Waga (kg)"
                        type="number"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                    />
                    <TextField
                        label="Numer"
                        type="number"
                        value={jerseyNumber}
                        onChange={(e) => setJerseyNumber(e.target.value)}
                    />
                    <TextField
                        select
                        label="Noga"
                        value={preferredFoot}
                        onChange={(e) => setPreferredFoot(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">-</MenuItem>
                        {FEET.map((f) => (
                            <MenuItem key={f} value={f}>{FOOT_LABELS[f]}</MenuItem>
                        ))}
                    </TextField>
                    <Button type="submit" variant="contained">
                        Dodaj zawodnika
                    </Button>
                </Box>
            )}

            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Imię</TableCell>
                            <TableCell>Nazwisko</TableCell>
                            <TableCell>Data urodzenia</TableCell>
                            <TableCell>Pozycja</TableCell>
                            <TableCell>Wzrost</TableCell>
                            <TableCell>Waga</TableCell>
                            <TableCell>Numer</TableCell>
                            <TableCell>Noga</TableCell>
                            {(canEdit || canDelete) && <TableCell>Akcje</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players.map((player) => 
                            editingId === player.id ? (
                                <TableRow key={player.id}>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editFirstName} 
                                            onChange={(e) => setEditFirstName(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editLastName} 
                                            onChange={(e) => setEditLastName(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="date"
                                            slotProps={{ inputLabel: {shrink: true} }}
                                            value={editDateOfBirth}
                                            onChange={(e) => setEditDateOfBirth(e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editPosition} 
                                            onChange={(e) => setEditPosition(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editHeightCm}
                                            onChange={(e) => setEditHeightCm(e.target.value)}
                                            sx={{ width: 80 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editWeightKg}
                                            onChange={(e) => setEditWeightKg(e.target.value)}
                                            sx={{ width: 80 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editJerseyNumber}
                                            onChange={(e) => setEditJerseyNumber(e.target.value)}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={editPreferredFoot}
                                            onChange={(e) => setEditPreferredFoot(e.target.value)}
                                            sx={{ minWidth: 100 }}
                                        >
                                            <MenuItem value="">-</MenuItem>
                                            {FEET.map((f) => (
                                                <MenuItem key={f} value={f}>{FOOT_LABELS[f]}</MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="contained" onClick={() => saveEdit(player.id)}>Zapisz</Button>
                                            <Button size="small" onClick={() => setEditingId(null)}>Anuluj</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={player.id}>
                                    <TableCell>{player.firstName}</TableCell>
                                    <TableCell>{player.lastName}</TableCell>
                                    <TableCell>{player.dateOfBirth}</TableCell>
                                    <TableCell>{player.position}</TableCell>
                                    <TableCell>{player.heightCm ?? "-"}</TableCell>
                                    <TableCell>{player.weightKg ?? "-"}</TableCell>
                                    <TableCell>{player.jerseyNumber ?? "-"}</TableCell>
                                    <TableCell>{player.preferredFoot ? FOOT_LABELS[player.preferredFoot] : "-"}</TableCell>
                                    {(canEdit || canDelete) && (
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                {canEdit && <Button size="small" onClick={() => startEdit(player)}>Edytuj</Button>}
                                                {canDelete && <Button size="small" color="error" onClick={() => handleDelete(player.id)}>Usuń</Button>}
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