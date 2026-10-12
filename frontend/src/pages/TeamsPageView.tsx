import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Alert,
    Box,
    TextField,
    Button,
    Avatar
} from '@mui/material';
import type { Team } from '../types/team';
import { BACKEND_ORIGIN } from '../api/axiosInstance';

interface TeamsPageViewProps {
    teams: Team[];
    isAdmin: boolean;
    canEdit: boolean;
    canDelete: boolean;

    name: string;
    foundedDate: string;
    logoUrl: string | null;
    formError: string | null;
    onNameChange: (value: string) => void;
    onFoundedDateChange: (value: string) => void;
    onLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreate: (e: React.SyntheticEvent) => void;
    
    editingId: number | null;
    editName: string;
    editFoundedDate: string;
    editLogoUrl: string | null;
    actionError: string | null;
    onStartEdit: (team: Team) => void;
    onEditNameChange: (value: string) => void;
    onEditFoundedDateChange: (value: string) => void;
    onEditLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (teamId: number) => void;
    onCancelEdit: () => void;
    onDelete: (teamId: number) => void;
}

export function TeamsPageView({
    teams,
    isAdmin,
    canEdit,
    canDelete,
    name,
    foundedDate,
    logoUrl,
    formError,
    onNameChange,
    onFoundedDateChange,
    onLogoSelect,
    onCreate,
    editingId,
    editName,
    editFoundedDate,
    editLogoUrl,
    actionError,
    onStartEdit,
    onEditNameChange,
    onEditFoundedDateChange,
    onEditLogoSelect,
    onSaveEdit,
    onCancelEdit,
    onDelete
}: TeamsPageViewProps) {
     return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Drużyny
            </Typography>

            {isAdmin && (
                <Box
                    component="form"
                    onSubmit={onCreate}
                    sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start" }}
                >
                    {formError && <Alert severity="error">{formError}</Alert>}
                    <TextField
                        label="Nazwa"
                        value={name}
                        onChange={(e) => onNameChange(e.target.value)}
                        required
                    />
                    <TextField
                        label="Data założenia"
                        type="date"
                        slotProps={{ inputLabel: { shrink: true } }}
                        value={foundedDate}
                        onChange={(e) => onFoundedDateChange(e.target.value)}
                        required
                    />
                    {logoUrl && <Avatar src={`${BACKEND_ORIGIN}${logoUrl}`} variant="rounded" />}
                    <Button component="label" variant="outlined">
                        Wybierz logo
                        <input type="file" accept="image/png,image/jpeg" hidden onChange={onLogoSelect} />
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
                                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onEditLogoSelect} />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editName} 
                                            onChange={(e) => onEditNameChange(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            type="date" 
                                            slotProps={{ inputLabel: { shrink: true } }}
                                            value={editFoundedDate}
                                            onChange={(e) => onEditFoundedDateChange(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            <Button size="small" variant="contained" onClick={() => onSaveEdit(team.id)}>Zapisz</Button>
                                            <Button size="small" onClick={onCancelEdit}>Anuluj</Button>
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
                                                {canEdit && <Button size="small" onClick={() => onStartEdit(team)}>Edytuj</Button>}
                                                {canDelete && <Button size="small" color="error" onClick={() => onDelete(team.id)}>Usuń</Button>}
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