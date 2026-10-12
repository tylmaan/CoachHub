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
import type { UserSummary } from "../types/user";
import type { Team } from "../types/team";
import { ROLE_LABELS } from "../constants/labels";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

type SortField = "email" | "roles" | "teamId" | "fullName";
const ROLES = ["Coach", "AssistantCoach", "Analyst"];
const REGISTER_ROLES = ["Admin", "Coach", "AssistantCoach", "Analyst"];

interface UsersPageViewProps {
    users: UserSummary[];
    teams: Team[];
    sortField: SortField;
    sortAsc: boolean;
    onSort: (field: SortField) => void;
    actionError: string | null;

    editingId: string | null;
    editRole: string;
    editTeamId: number;
    editFullName: string;
    editPhotoUrl: string | null;
    onStartEdit: (user: UserSummary) => void;
    onEditFullNameChange: (value: string) => void;
    onEditRoleChange: (value: string) => void;
    onEditTeamIdChange: (value: number) => void;
    onEditPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: string) => void;
    onCancelEdit: () => void;
    onDelete: (id: string) => void;

    registerOpen: boolean;
    newFullName: string;
    newPhotoUrl: string | null;
    newEmail: string;
    newPassword: string;
    newRole: string;
    newTeamId: number | "";
    registerError: string | null;
    onOpenRegisterDialog: () => void;
    onCloseRegisterDialog: () => void;
    onNewFullNameChange: (value: string) => void;
    onNewPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNewEmailChange: (value: string) => void;
    onNewPasswordChange: (value: string) => void;
    onNewRoleChange: (value: string) => void;
    onNewTeamIdChange: (value: number) => void;
    onRegisterSubmit: (e: React.SyntheticEvent) => void;
}

export function UsersPageView({
    users,
    teams,
    sortField,
    sortAsc,
    onSort,
    actionError,
    editingId,
    editRole,
    editTeamId,
    editFullName,
    editPhotoUrl,
    onStartEdit,
    onEditFullNameChange,
    onEditRoleChange,
    onEditTeamIdChange,
    onEditPhotoSelect,
    onSaveEdit,
    onCancelEdit,
    onDelete,
    registerOpen,
    newFullName,
    newPhotoUrl,
    newEmail,
    newPassword,
    newRole,
    newTeamId,
    registerError,
    onOpenRegisterDialog,
    onCloseRegisterDialog,
    onNewFullNameChange,
    onNewPhotoSelect,
    onNewEmailChange,
    onNewPasswordChange,
    onNewRoleChange,
    onNewTeamIdChange,
    onRegisterSubmit
}: UsersPageViewProps) {
    function teamName(teamId: number | null) {
        return teams.find((t) => t.id == teamId)?.name ?? "-";
    }
    
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">
                    Użytkownicy
                </Typography>
                <Button variant="contained" onClick={onOpenRegisterDialog}>
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
                                    onClick={() => onSort("email")}
                                >
                                    Email
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "fullName"}
                                    direction={sortAsc ? "asc" : "desc"} 
                                    onClick={() => onSort("fullName")}
                                >
                                    Imię i Nazwisko
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "roles"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => onSort("roles")}
                                >
                                    Rola
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "teamId"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => onSort("teamId")}
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
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.email}</TableCell>
                                {editingId === user.id ? (
                                    <>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {editPhotoUrl && <Avatar src={`${BACKEND_ORIGIN}${editPhotoUrl}`} />}
                                                <Button component="label" size="small">
                                                    Zmień
                                                    <input type="file" accept="image/png,image/jpeg" hidden onChange={onEditPhotoSelect} />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField size="small" value={editFullName} onChange={(e) => onEditFullNameChange(e.target.value)} />
                                        </TableCell>
                                        <TableCell>
                                            <Select value={editRole} onChange={(e) => onEditRoleChange(e.target.value)} size="small">
                                                {ROLES.map((r) => (
                                                    <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Select value={editTeamId} onChange={(e) => onEditTeamIdChange(Number(e.target.value))} size="small">
                                                {teams.map((t) => (
                                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                                ))}
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button size="small" variant="contained" onClick={() => onSaveEdit(user.id)}>Zapisz</Button>
                                                <Button size="small" onClick={onCancelEdit}>Anuluj</Button>
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
                                                <Button size="small" onClick={() => onStartEdit(user)}>Edytuj</Button>
                                                <Button size="small" color="error" onClick={() => onDelete(user.id)}>Usuń</Button>
                                            </Box>
                                        </TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <Dialog open={registerOpen} onClose={onCloseRegisterDialog} fullWidth maxWidth="xs">
                <Box component="form" onSubmit={onRegisterSubmit}>
                    <DialogTitle>Nowe konto</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        {registerError && <Alert severity="error">{registerError}</Alert>}
                        <TextField
                            label="Imię i nazwisko"
                            value={newFullName}
                            onChange={(e) => onNewFullNameChange(e.target.value)}
                        />
                        <TextField
                            label="Email"
                            type="email"
                            value={newEmail}
                            onChange={(e) => onNewEmailChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Hasło"
                            type="password"
                            value={newPassword}
                            onChange={(e) => onNewPasswordChange(e.target.value)}
                            required
                        />
                        <TextField
                            select
                            label="Rola"
                            value={newRole}
                            onChange={(e) => onNewRoleChange(e.target.value)}
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
                                onChange={(e) => onNewTeamIdChange(Number(e.target.value))}
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
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onNewPhotoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseRegisterDialog}>Anuluj</Button>
                        <Button type="submit" variant="contained">Utwórz konto</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    );
}
