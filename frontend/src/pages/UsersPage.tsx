import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Button,
    MenuItem,
    Select,
    Box,
    TextField,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from "@mui/material";
import axios from "axios";
import { getUsers, updateUser, deleteUser } from "../api/usersApi";
import { getTeams } from "../api/teamsApi";
import { register } from "../api/authApi";
import type { UserSummary } from "../types/user";
import type { Team } from "../types/team";
import { ROLE_LABELS } from "../constants/labels";
import { uploadFile } from "../api/filesApi";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

type SortField = "email" | "roles" | "teamId" | "fullName";
const ROLES = ["Coach", "AssistantCoach", "Analyst"];
const REGISTER_ROLES = ["Admin", "Coach", "AssistantCoach", "Analyst"];

export function UsersPage() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("email");
    const [sortAsc, setSortAsc] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState("Coach");
    const [editTeamId, setEditTeamId] = useState<number>(0);
    const [editFullName, setEditFullName] = useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [registerOpen, setRegisterOpen] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("Coach");
    const [newTeamId, setNewTeamId] = useState<number | "">("");
    const [registerError, setRegisterError] = useState<string | null>(null);

    function loadUsers() {
        setLoading(true);
        getUsers() 
            .then(setUsers)
            .catch(() => setError("Nie udało się pobrać użytkowników."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadUsers();
        getTeams().then(setTeams).catch(() => {});
    }, []);

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    }

    async function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditPhotoUrl(url);
        } catch {
            setActionError("Nie udało się wgrać zdjęcia.");
        }
    }

    async function handleNewPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setNewPhotoUrl(url);
        } catch {
            setRegisterError("Nie udało się wgrać zdjęcia.");
        }
    }

    function openRegisterDialog() {
        setRegisterOpen(true);
        setRegisterError(null);
    }

    function closeRegisterDialog() {
        setRegisterOpen(false);
        setNewFullName("");
        setNewPhotoUrl(null);
        setNewEmail("");
        setNewPassword("");
        setNewRole("Coach");
        setNewTeamId("");
        setRegisterError(null);
    }

    async function handleRegisterSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setRegisterError(null);
        try {
            await register({
                fullName: newFullName || null,
                photoUrl: newPhotoUrl,
                email: newEmail,
                password: newPassword,
                role: newRole,
                teamId: newRole === "Admin" ? null : (newTeamId as number),
            });
            closeRegisterDialog();
            loadUsers();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setRegisterError(err.response.data.join(" "));
            } else {
                setRegisterError("Nie udało się zarejestrować użytkownika.");
            }
        }
    }

    function startEdit(user: UserSummary) {
        setEditingId(user.id);
        setEditRole(user.roles[0] ?? "Coach");
        setEditTeamId(user.teamId ?? teams[0]?.id ?? 0);
        setEditFullName(user.fullName ?? "");
        setEditPhotoUrl(user.photoUrl);
        setActionError(null);
    }

    async function saveEdit(id: string) {
        setActionError(null)
        try {
            await updateUser(id, { role: editRole, teamId: editTeamId, fullName: editFullName, photoUrl: editPhotoUrl || null });
            setEditingId(null);
            loadUsers();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: string) {
        setActionError(null);
        try {
            await deleteUser(id);
            loadUsers();
        } catch {
            setActionError("Nie udało się usunąć użytkownika.")
        }
    }

    function teamName(teamId: number | null) {
        return teams.find((t) => t.id == teamId)?.name ?? "-";
    }

    const sortedUsers = [...users].sort((a, b) => {
        let result = 0;
        if (sortField === "email") result = a.email.localeCompare(b.email);
        if (sortField === "roles") result = a.roles.join(",").localeCompare(b.roles.join(","));
        if (sortField === "teamId") result = (a.teamId ?? 0) - (b.teamId ?? 0);
        if (sortField === "fullName") result = (a.fullName ?? "").localeCompare(b.fullName ?? "");
        return sortAsc ? result : - result;
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>

    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">
                    Użytkownicy
                </Typography>
                <Button variant="contained" onClick={openRegisterDialog}>
                    Dodaj użytkownika
                </Button>
            </Box>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Zdjęcie</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "email"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => handleSort("email")}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "fullName"}
                                    direction={sortAsc ? "asc" : "desc"} 
                                    onClick={() => handleSort("fullName")}
                                >
                                    Imię i Nazwisko
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "roles"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => handleSort("roles")}
                                >
                                    Rola
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "teamId"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => handleSort("teamId")}
                                >
                                    Drużyna
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                Akcje
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                {editingId === user.id ? (
                                    <>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {editPhotoUrl && <Avatar src={`${BACKEND_ORIGIN}${editPhotoUrl}`} />}
                                                <Button component="label" size="small">
                                                    Zmień
                                                    <input type="file" accept="image/png,image/jpeg" hidden onChange={handleEditPhotoSelect} />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField size="small" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)} size="small">
                                                {ROLES.map((r) => (
                                                    <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={editTeamId} onChange={(e) => setEditTeamId(Number(e.target.value))} size="small">
                                                {teams.map((t) => (
                                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button size="small" variant="contained" onClick={() => saveEdit(user.id)}>Zapisz</Button>
                                                <Button size="small" onClick={() => setEditingId(null)}>Anuluj</Button>
                                            </Box>
                                        </TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>
                                            {user.photoUrl ? (
                                                <Avatar src={`${BACKEND_ORIGIN}${user.photoUrl}`} />
                                            ) : (
                                                <Avatar>{(user.fullName ?? user.email)[0]}</Avatar>
                                            )}
                                        </TableCell>
                                        <TableCell>{user.fullName ?? "-"}</TableCell>
                                        <TableCell>{user.roles.map((r) => ROLE_LABELS[r] ?? r).join(", ")}</TableCell>
                                        <TableCell>{teamName(user.teamId)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button size="small" onClick={() => startEdit(user)}>Edytuj</Button>
                                                <Button size="small" color="error" onClick={() => handleDelete(user.id)}>Usuń</Button>
                                            </Box>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={registerOpen} onClose={closeRegisterDialog} fullWidth maxWidth="xs">
                <Box component="form" onSubmit={handleRegisterSubmit}>
                    <DialogTitle>Nowe konto</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        {registerError && <Alert severity="error">{registerError}</Alert>}
                        <TextField
                            label="Imię i nazwisko"
                            value={newFullName}
                            onChange={(e) => setNewFullName(e.target.value)}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            required
                        />
                        <TextField
                            label="Hasło"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        <TextField
                            select
                            label="Rola"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        >
                            {REGISTER_ROLES.map((r) => (
                                <MenuItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</MenuItem>
                            ))}
                        </TextField>
                        {newRole !== "Admin" && (
                            <TextField
                                select
                                label="Drużyna"
                                value={newTeamId}
                                onChange={(e) => setNewTeamId(Number(e.target.value))}
                                required
                            >
                                {teams.map((team) => (
                                    <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {newPhotoUrl && <Avatar src={`${BACKEND_ORIGIN}${newPhotoUrl}`} />}
                            <Button component="label" variant="outlined" size="small">
                                Wybierz zdjęcie
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={handleNewPhotoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeRegisterDialog}>Anuluj</Button>
                        <Button type="submit" variant="contained">Utwórz konto</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    );
}