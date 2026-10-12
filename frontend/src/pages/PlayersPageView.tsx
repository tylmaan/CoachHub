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
    MenuItem,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import type { Player } from '../types/player';
import { FOOT_LABELS } from '../constants/labels';
import { BACKEND_ORIGIN } from '../api/axiosInstance';

const FEET = ["Left", "Right", "Both"];

interface PlayersPageViewProps {
    players: Player[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;

    firstName: string;
    lastName: string;
    dateOfBirth: string;
    position: string;
    heightCm: string;
    jerseyNumber: string;
    preferredFoot: string;
    photoUrl: string | null;
    formError: string | null;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onDateOfBirthChange: (value: string) => void;
    onPositionChange: (value: string) => void;
    onHeightCmChange: (value: string) => void;
    onJerseyNumberChange: (value: string) => void;
    onPreferredFootChange: (value: string) => void;
    onPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreate: (e: React.SyntheticEvent) => void;
    createOpen: boolean;
    onOpenCreate: () => void;
    onCloseCreate: () => void;

    editingId: number | null;
    editFirstName: string;
    editLastName: string;
    editDateOfBirth: string;
    editPosition: string;
    editHeightCm: string;
    editJerseyNumber: string;
    editPreferredFoot: string;
    editPhotoUrl: string | null;
    actionError: string | null;
    onStartEdit: (player: Player) => void;
    onEditFirstNameChange: (value: string) => void;
    onEditLastNameChange: (value: string) => void;
    onEditDateOfBirthChange: (value: string) => void;
    onEditPositionChange: (value: string) => void;
    onEditHeightCmChange: (value: string) => void;
    onEditJerseyNumberChange: (value: string) => void;
    onEditPreferredFootChange: (value: string) => void;
    onEditPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: number) => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
}

export function PlayersPageView({
    players,
    canCreate,
    canEdit,
    canDelete,
    firstName,
    lastName,
    dateOfBirth,
    position,
    heightCm,
    jerseyNumber,
    preferredFoot,
    photoUrl,
    formError,
    onFirstNameChange,
    onLastNameChange,
    onDateOfBirthChange,
    onPositionChange,
    onHeightCmChange,
    onJerseyNumberChange,
    onPreferredFootChange,
    onPhotoSelect,
    onCreate,
    createOpen,
    onOpenCreate,
    onCloseCreate,
    editingId,
    editFirstName,
    editLastName,
    editDateOfBirth,
    editPosition,
    editHeightCm,
    editJerseyNumber,
    editPreferredFoot,
    editPhotoUrl,
    actionError,
    onStartEdit,
    onEditFirstNameChange,
    onEditLastNameChange,
    onEditDateOfBirthChange,
    onEditPositionChange,
    onEditHeightCmChange,
    onEditJerseyNumberChange,
    onEditPreferredFootChange,
    onEditPhotoSelect,
    onSaveEdit,
    onCancelEdit,
    onDelete
}: PlayersPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4" sx={{ mb: 2 }}>
                    Zawodnicy
                </Typography>
                {canCreate && (
                    <Button variant="contained" onClick={onOpenCreate}>
                        Dodaj zawodnika
                    </Button>
                )}
            </Box>

            <Dialog open={createOpen} onClose={onCloseCreate} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={onCreate}>
                    <DialogTitle>Nowy zawodnik</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1 }}>
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField
                            label="Imię"
                            value={firstName}
                            onChange={(e) => onFirstNameChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Nazwisko"
                            value={lastName}
                            onChange={(e) => onLastNameChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Data urodzenia"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={dateOfBirth}
                            onChange={(e) => onDateOfBirthChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Pozycja"
                            value={position}
                            onChange={(e) => onPositionChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Wzrost (cm)"
                            type="number"
                            value={heightCm}
                            onChange={(e) => onHeightCmChange(e.target.value)}
                        />
                        <TextField
                            label="Numer"
                            type="number"
                            value={jerseyNumber}
                            onChange={(e) => onJerseyNumberChange(e.target.value)}
                        />
                        <TextField
                            select
                            label="Noga"
                            value={preferredFoot}
                            onChange={(e) => onPreferredFootChange(e.target.value)}
                            sx={{ minWidth: 120 }}
                        >
                            <MenuItem value="">-</MenuItem>
                            {FEET.map((f) => (
                                <MenuItem key={f} value={f}>{FOOT_LABELS[f]}</MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {photoUrl && <Avatar src={`${BACKEND_ORIGIN}${photoUrl}`} />}
                            <Button component="label" variant="outlined" size="small">
                                Wybierz zdjęcie
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onPhotoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseCreate}>Anuluj</Button>
                        <Button type="submit" variant="contained">Dodaj zawodnika</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Zdjęcie</TableCell>
                            <TableCell>Imię</TableCell>
                            <TableCell>Nazwisko</TableCell>
                            <TableCell>Data urodzenia</TableCell>
                            <TableCell>Pozycja</TableCell>
                            <TableCell>Wzrost</TableCell>
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
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            {editPhotoUrl && <Avatar src={`${BACKEND_ORIGIN}${editPhotoUrl}`} />}
                                            <Button component="label" size="small">
                                                Zmień
                                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onEditPhotoSelect} />
                                            </Button>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editFirstName} 
                                            onChange={(e) => onEditFirstNameChange(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editLastName} 
                                            onChange={(e) => onEditLastNameChange(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="date"
                                            slotProps={{ inputLabel: {shrink: true} }}
                                            value={editDateOfBirth}
                                            onChange={(e) => onEditDateOfBirthChange(e.target.value)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField 
                                            size="small" 
                                            value={editPosition} 
                                            onChange={(e) => onEditPositionChange(e.target.value)} 
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editHeightCm}
                                            onChange={(e) => onEditHeightCmChange(e.target.value)}
                                            sx={{ width: 80 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            size="small"
                                            type="number"
                                            value={editJerseyNumber}
                                            onChange={(e) => onEditJerseyNumberChange(e.target.value)}
                                            sx={{ width: 70 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            value={editPreferredFoot}
                                            onChange={(e) => onEditPreferredFootChange(e.target.value)}
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
                                            <Button size="small" variant="contained" onClick={() => onSaveEdit(player.id)}>Zapisz</Button>
                                            <Button size="small" onClick={onCancelEdit}>Anuluj</Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={player.id}>
                                    <TableCell>
                                        {player.photoUrl ? (
                                            <Avatar src={`${BACKEND_ORIGIN}${player.photoUrl}`} />
                                        ) :(
                                            <Avatar>{player.firstName[0]}</Avatar>    
                                        )}
                                    </TableCell>
                                    <TableCell>{player.firstName}</TableCell>
                                    <TableCell>{player.lastName}</TableCell>
                                    <TableCell>{player.dateOfBirth}</TableCell>
                                    <TableCell>{player.position}</TableCell>
                                    <TableCell>{player.heightCm ?? "-"}</TableCell>
                                    <TableCell>{player.jerseyNumber ?? "-"}</TableCell>
                                    <TableCell>{player.preferredFoot ? FOOT_LABELS[player.preferredFoot] : "-"}</TableCell>
                                    {(canEdit || canDelete) && (
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                {canEdit && <Button size="small" onClick={() => onStartEdit(player)}>Edytuj</Button>}
                                                {canDelete && <Button size="small" color="error" onClick={() => onDelete(player.id)}>Usuń</Button>}
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