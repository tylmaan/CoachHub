import {
    Paper,
    Typography,
    Alert,
    Button,
    MenuItem,
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
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { UserList } from "../components/users/UserList";
import { UserListFilters } from "../components/users/UserListFilters";
import { UserEditPanel } from "../components/users/UserEditPanel";
import type { RoleFilter, UserGroup } from "../types/userDirectory";

const REGISTER_ROLES = ["Admin", "Coach", "AssistantCoach", "Analyst"];

interface UsersPageViewProps {
    teams: Team[];
    actionError: string | null;
    groups: UserGroup[];
    counts: Record<string, number>;
    roleFilter: RoleFilter;
    onRoleFilterChange: (value: RoleFilter) => void;
    query: string;
    onQueryChange: (value: string) => void;
    selectedUser: UserSummary | null;
    onSelectUser: (user: UserSummary) => void;
    editRole: string;
    editTeamId: number;
    editFullName: string;
    editPhotoUrl: string | null;
    onEditFullNameChange: (value: string) => void;
    onEditRoleChange: (value: string) => void;
    onEditTeamIdChange: (value: number) => void;
    onEditPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: string) => void;
    onCancelEdit: () => void;
    deleteDialogOpen: boolean;
    onRequestDelete: (id: string) => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;

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
    teams,
    groups,
    counts,
    roleFilter,
    onRoleFilterChange,
    query,
    onQueryChange,
    selectedUser,
    onSelectUser,
    actionError,
    editRole,
    editTeamId,
    editFullName,
    editPhotoUrl,
    onEditFullNameChange,
    onEditRoleChange,
    onEditTeamIdChange,
    onEditPhotoSelect,
    onSaveEdit,
    onCancelEdit,
    deleteDialogOpen,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
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
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 5fr) minmax(0, 6fr)" }, gap: 2, alignItems: "start" }}>
                <Box>
                    <UserListFilters
                        query={query}
                        onQueryChange={onQueryChange}
                        role={roleFilter}
                        onRoleChange={onRoleFilterChange}
                        counts={counts}
                    />
                    <UserList groups={groups} selectedId={selectedUser?.id ?? null} onSelect={onSelectUser} />
                </Box>
                {selectedUser ? (
                    <UserEditPanel
                        user={selectedUser}
                        teams={teams}
                        fullName={editFullName}
                        role={editRole}
                        teamId={editTeamId}
                        photoUrl={editPhotoUrl}
                        onFullNameChange={onEditFullNameChange}
                        onRoleChange={onEditRoleChange}
                        onTeamIdChange={onEditTeamIdChange}
                        onPhotoSelect={onEditPhotoSelect}
                        onSave={() => onSaveEdit(selectedUser.id)}
                        onCancel={onCancelEdit}
                        onDelete={() => onRequestDelete(selectedUser.id)}
                    />
                ) : (
                    <Paper variant="outlined" sx={{ p: 3 }}>
                        <Typography color="text.secondary">Wybierz osobę z listy.</Typography>
                    </Paper>
                )}
            </Box>
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

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                title="Usunąć użytkownika?"
                message="Usunięcie tego użytkownika skasuje też wszystkie raporty i schematy taktyczne, które utworzył. Tej operacji nie można cofnąć."
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />
        </>
    );
}
