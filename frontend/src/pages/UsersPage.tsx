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
} from "@mui/material";
import { getUsers, updateUser, deleteUser } from "../api/usersApi";
import { getTeams } from "../api/teamsApi";
import type { UserSummary } from "../types/user";
import type { Team } from "../types/team";

type SortField = "email" | "roles" | "teamId";
const ROLES = ["Coach", "AssistantCoach", "Analyst"];

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
    const [actionError, setActionError] = useState<string | null>(null);

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

    function startEdit(user: UserSummary) {
        setEditingId(user.id);
        setEditRole(user.roles[0] ?? "Coach");
        setEditTeamId(user.teamId ?? teams[0]?.id ?? 0);
        setActionError(null);
    }

    async function saveEdit(id: string) {
        setActionError(null)
        try {
            await updateUser(id, { role: editRole, teamId: editTeamId });
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
        return sortAsc ? result : - result;
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>

    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Użytkownicy
            </Typography>
            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
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
                                            <Select value={editRole} onChange={(e) => setEditRole(e.target.value)} size="small">
                                                {ROLES.map((r) => (
                                                    <MenuItem key={r} value={r}>{r}</MenuItem>
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
                                        <TableCell>{user.roles.join(", ")}</TableCell>
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
        </>
    );
}