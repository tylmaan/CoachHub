import {
    Avatar,
    Box,
    Button,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
import { BACKEND_ORIGIN } from "../../api/axiosInstance";
import { ROLE_LABELS } from "../../constants/labels";
import { userInitials, userLabel } from "../../types/userDirectory";
import type { Team } from "../../types/team";
import type { UserSummary } from "../../types/user";

const EDITABLE_ROLES = ["Coach", "AssistantCoach", "Analyst"];

interface UserEditPanelProps {
    user: UserSummary;
    teams: Team[];
    fullName: string;
    role: string;
    teamId: number;
    photoUrl: string | null;
    onFullNameChange: (value: string) => void;
    onRoleChange: (value: string) => void;
    onTeamIdChange: (value: number) => void;
    onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
    onCancel: () => void;
    onDelete: () => void;
}

export function UserEditPanel({
    user,
    teams,
    fullName,
    role,
    teamId,
    photoUrl,
    onFullNameChange,
    onRoleChange,
    onTeamIdChange,
    onPhotoSelect,
    onSave,
    onCancel,
    onDelete,
}: UserEditPanelProps) {
    return (
        <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <Avatar
                    src={photoUrl ? `${BACKEND_ORIGIN}${photoUrl}` : undefined}
                    sx={{ width: 56, height: 56, fontSize: 18 }}
                >
                    {userInitials(user)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" noWrap>{userLabel(user)}</Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>{user.email}</Typography>
                </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                    label="Imię i nazwisko"
                    value={fullName}
                    onChange={(e) => onFullNameChange(e.target.value)}
                />
                <TextField select label="Rola" value={role} onChange={(e) => onRoleChange(e.target.value)}>
                    {EDITABLE_ROLES.map((r) => (
                        <MenuItem key={r} value={r}>{ROLE_LABELS[r]}</MenuItem>
                    ))}
                </TextField>
                <TextField select label="Drużyna" value={teamId} onChange={(e) => onTeamIdChange(Number(e.target.value))}>
                    {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 3 }}>
                <Button variant="contained" onClick={onSave}>Zapisz</Button>
                <Button onClick={onCancel}>Anuluj</Button>
                <Button component="label">
                    Zmień zdjęcie
                    <input type="file" accept="image/png,image/jpeg" hidden onChange={onPhotoSelect} />
                </Button>
                <Button color="error" onClick={onDelete} sx={{ ml: "auto" }}>Usuń</Button>
            </Box>
        </Paper>
    );
}