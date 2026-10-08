import { useEffect, useState } from "react";
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
    Avatar,
} from "@mui/material";
import axios from "axios";
import { getMatches, createMatch, updateMatch, deleteMatch } from "../api/matchesApi";
import type { Match } from "../types/match";
import { useAuth } from "../context/AuthContext";
import { MATCH_TYPE_LABELS } from "../constants/labels";
import { uploadFile } from "../api/filesApi";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

const MATCH_TYPES = ["League", "Cup", "Friendly"];

function toNullableNumber(value: string): number | null {
    return value == "" ? null : Number(value);
}

function toNullableBool(value: string): boolean | null {
    return value == "" ? null : value === "true";
}

export function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [date, setDate] = useState("");
    const [opponent, setOpponent] = useState("");
    const [season, setSeason] = useState("");
    const [scoreFor, setScoreFor] = useState("");
    const [scoreAgainst, setScoreAgainst] = useState("");
    const [isHome, setIsHome] = useState("");
    const [matchType, setMatchType] = useState("");
    const [round, setRound] = useState("");
    const [opponentLogoUrl, setOpponentLogoUrl] = useState("");
    const [ formError, setFormError ] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDate, setEditDate] = useState("");
    const [editOpponent, setEditOpponent] = useState("");
    const [editSeason, setEditSeason] = useState("");
    const [editScoreFor, setEditScoreFor] = useState("");
    const [editScoreAgainst, setEditScoreAgainst] = useState("");
    const [editIsHome, setEditIsHome] = useState("");
    const [editMatchType, setEditMatchType] = useState("");
    const [editRound, setEditRound] = useState("");
    const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);

    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");

    function loadMatches() {
        setLoading(true);
        getMatches()
            .then(setMatches)
            .catch(() => setError("Nie udało się pobrać meczów."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadMatches();
    }, []);

    async function handleOpponentLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setOpponentLogoUrl(url);
        } catch {
            setFormError("Nie udało się przesłać pliku.");
        }
    }

    async function handleEditOpponentLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditOpponentLogoUrl(url);
        } catch {
            setActionError("Nie udało się przesłać pliku.");
        }
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createMatch({
                date,
                opponent,
                season,
                teamId: teamId as number,
                scoreFor: toNullableNumber(scoreFor),
                scoreAgainst: toNullableNumber(scoreAgainst),
                isHome: toNullableBool(isHome),
                matchType: matchType || null,
                round: toNullableNumber(round),
                opponentLogoUrl: opponentLogoUrl || null,
            });
            setDate("");
            setOpponent("");
            setSeason("");
            setScoreFor("");
            setScoreAgainst("");
            setIsHome("");
            setMatchType("");
            setRound("");
            setOpponentLogoUrl("");
            loadMatches();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć meczu.");
            }
        }
    }

    function startEdit(match: Match) {
        setEditingId(match.id);
        setEditDate(match.date);
        setEditOpponent(match.opponent);
        setEditSeason(match.season);
        setEditScoreFor(match.scoreFor?.toString() ?? "");
        setEditScoreAgainst(match.scoreAgainst?.toString() ?? "");
        setEditIsHome(match.isHome?.toString() ?? "");
        setEditMatchType(match.matchType ?? "");
        setEditRound(match.round?.toString() ?? "");
        setEditOpponentLogoUrl(match.opponentLogoUrl ?? "");
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updateMatch(id, {
                date: editDate,
                opponent: editOpponent,
                season: editSeason,
                teamId: teamId as number,
                scoreFor: toNullableNumber(editScoreFor),
                scoreAgainst: toNullableNumber(editScoreAgainst),
                isHome: toNullableBool(editIsHome),
                matchType: editMatchType || null,
                round: toNullableNumber(editRound),
                opponentLogoUrl: editOpponentLogoUrl || null,
            });
            setEditingId(null);
            loadMatches();
        } catch {
            setActionError("Nie udało się zaktualizować meczu.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deleteMatch(id);
            loadMatches();
        } catch {
            setActionError("Nie udało się usunąć meczu.");
        }
    }

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Typography variant="h4"  sx={{ mb: 2 }}>
                Mecze
            </Typography>

            {canCreate && (
                <Box 
                    component="form"
                    onSubmit={handleCreate}
                    sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}
                >
                    {formError && <Alert severity="error">{formError}</Alert>}
                    <TextField
                        label="Data"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                    <TextField
                        label="Przeciwnik"
                        value={opponent}
                        onChange={(e) => setOpponent(e.target.value)}
                        required
                    />
                    <TextField
                        label="Sezon"
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        required
                    />
                    <TextField
                        label="Bramki strzelone"
                        value={scoreFor}
                        onChange={(e) => setScoreFor(e.target.value)}
                    />
                    <TextField
                        label="Bramki stracone"
                        value={scoreAgainst}
                        onChange={(e) => setScoreAgainst(e.target.value)}
                    />
                    <TextField
                        select
                        label="Typ meczu"
                        value={matchType}
                        onChange={(e) => setMatchType(e.target.value)}
                        sx={{ minWidth: 140 }}
                    >
                        <MenuItem value="">--</MenuItem>
                        {MATCH_TYPES.map((t) => (
                            <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                        ))}
                    </TextField>
                    {matchType === "League" && (
                        <TextField
                            label="Kolejka"
                            type="number"
                            value={round}
                            onChange={(e) => setRound(e.target.value)}
                            sx={{ width: 100 }}
                        />
                    )}
                    <TextField
                        select
                        label="Dom/Wyjazd"
                        value={isHome}
                        onChange={(e) => setIsHome(e.target.value)}
                        sx={{ minWidth: 120 }}
                    >
                        <MenuItem value="">--</MenuItem>
                        <MenuItem value="true">Dom</MenuItem>
                        <MenuItem value="false">Wyjazd</MenuItem>
                    </TextField>
                    {opponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${opponentLogoUrl}`} variant="rounded" />}
                    <Button component="label" variant="outlined">
                        Logo przeciwnika
                        <input type="file" accept="image/png, image/jpeg" hidden onChange={handleOpponentLogoSelect} />
                    </Button>
                    <Button type="submit" variant="contained">
                        Dodaj mecz
                    </Button>
                </Box>
            )}
            
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Logo</TableCell>
                            <TableCell>Data</TableCell>
                            <TableCell>Przeciwnik</TableCell>
                            <TableCell>Sezon</TableCell>
                            <TableCell>Wynik</TableCell>
                            <TableCell>Dom/Wyjazd</TableCell>
                            <TableCell>Typ meczu</TableCell>
                            <TableCell>Kolejka</TableCell>
                            {(canEdit || canDelete) && <TableCell>Akcje</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {matches.map((match) => (
                            editingId === match.id ? (
                                <TableRow key={match.id}>
                                    <TableCell>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {editOpponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${editOpponentLogoUrl}`} variant="rounded" />}
                                            <Button component="label" size="small">
                                                Zmień logo
                                                <input type="file" accept="image/png, image/jpeg" hidden onChange={handleEditOpponentLogoSelect} />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="date"
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={editOpponent}
                                            onChange={(e) => setEditOpponent(e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            value={editSeason}
                                            onChange={(e) => setEditSeason(e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={editScoreFor}
                                                onChange={(e) => setEditScoreFor(e.target.value)}
                                                sx={{ width: 70 }}
                                            />
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={editScoreAgainst}
                                                onChange={(e) => setEditScoreAgainst(e.target.value)}
                                                sx={{ width: 70 }}
                                            />
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={editIsHome}
                                            onChange={(e) => setEditIsHome(e.target.value)}
                                            sx={{ minWidth: 100 }}
                                        >
                                            <MenuItem value="">--</MenuItem>
                                            <MenuItem value="true">Dom</MenuItem>
                                            <MenuItem value="false">Wyjazd</MenuItem>
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={editMatchType}
                                            onChange={(e) => setEditMatchType(e.target.value)}
                                            sx={{ minWidth: 120 }}
                                        >
                                            <MenuItem value="">--</MenuItem>
                                            {MATCH_TYPES.map((t) => (
                                                <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>
                                        {editMatchType === "League" && (
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={editRound}
                                                onChange={(e) => setEditRound(e.target.value)}
                                                sx={{ width: 70 }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="contained" onClick={() => saveEdit(match.id)}>Zapisz</Button>
                                            <Button size="small" onClick={() => setEditingId(null)}>Anuluj</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={match.id}>
                                    <TableCell>
                                        {match.opponentLogoUrl ? (
                                            <Avatar src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`} variant="rounded" />
                                        ) : (
                                            <Avatar variant="rounded">{match.opponent[0]}</Avatar> 
                                        )}
                                    </TableCell>
                                    <TableCell>{match.date}</TableCell>
                                    <TableCell>{match.opponent}</TableCell>
                                    <TableCell>{match.season}</TableCell>
                                    <TableCell>{match.scoreFor ?? "-"} : {match.scoreAgainst ?? "-"}</TableCell>
                                    <TableCell>{match.isHome === null ? "-" : match.isHome ? "Dom" : "Wyjazd"}</TableCell>
                                    <TableCell>{match.matchType ? MATCH_TYPE_LABELS[match.matchType] : "-"}</TableCell>
                                    <TableCell>{match.round ?? "-"}</TableCell>
                                    {(canEdit || canDelete) && (
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                {canEdit && <Button size="small" onClick={() => startEdit(match)}>Edytuj</Button>}
                                                {canDelete && <Button size="small" color="error" onClick={() => handleDelete(match.id)}>Usuń</Button>}
                                            </Box>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}