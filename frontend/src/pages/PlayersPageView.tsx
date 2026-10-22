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
    Box,
    TextField,
    Button,
    MenuItem,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete
} from '@mui/material';
import type { Player } from '../types/player';
import { FOOT_LABELS, POSITION_LABELS, POSITIONS } from '../constants/labels';
import { COUNTRIES } from '../constants/countries';
import type { Country } from '../constants/countries';
import { BACKEND_ORIGIN } from '../api/axiosInstance';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';

const FEET = ["Left", "Right", "Both"];

interface PlayersPageViewProps {
    players: Player[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    sortField: "lastName" | "position" | "jerseyNumber";
    sortAsc: boolean;
    onSort: (field: "lastName" | "position" | "jerseyNumber") => void;

    firstName: string;
    lastName: string;
    nationality: string | null;
    dateOfBirth: string;
    position: string;
    heightCm: string;
    jerseyNumber: string;
    preferredFoot: string;
    photoUrl: string | null;
    formError: string | null;
    onFirstNameChange: (value: string) => void;
    onLastNameChange: (value: string) => void;
    onNationalityChange: (value: string | null) => void;
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
    editNationality: string | null;
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
    onEditNationalityChange: (value: string | null) => void;
    onEditDateOfBirthChange: (value: string) => void;
    onEditPositionChange: (value: string) => void;
    onEditHeightCmChange: (value: string) => void;
    onEditJerseyNumberChange: (value: string) => void;
    onEditPreferredFootChange: (value: string) => void;
    onEditPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: number) => void;
    onCancelEdit: () => void;
    deleteDialogOpen: boolean;
    onRequestDelete: (id: number) => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
}

function renderFoot(foot: string | null) {
    const left = foot === "Left" || foot === "Both";
    const right = foot === "Right" || foot === "Both";
    const circleSx = (filled: boolean) => ({
        width: 20,
        height: 20,
        borderRadius: "50%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: filled ? "primary.main" : "transparent",
        color: filled ? "primary.contrastText" : "text.secondary",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        lineHeight: 1,
    });
    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            <Box sx={circleSx(left)}>L</Box>
            <Box sx={circleSx(right)}>R</Box>
        </Box>
    );
}

function positionChipStyle(position: string): { bg: string; color: string } {
    if (position === "GK") return { bg: "#dc2b2b", color: "#fff" };
    if (["LB", "CB", "RB", "LWB", "RWB"].includes(position)) return { bg: "#d3b323", color: "#fff" };
    if (["CDM", "CM", "CAM", "LM", "RM"].includes(position)) return { bg: "#0c7934", color: "#fff" };
    if (["LW", "RW", "CF", "ST"].includes(position)) return { bg: "#3b14c8", color: "#fff" };
    return { bg: "grey.700", color: "#fff" };
}

function JerseyNumber({ number }: { number: number | null }) {
    if (number === null) return <>-</>;
    return (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 40 40">
                <path
                    d="M12 4 L4 10 L8 16 L10 14 L10 34 Q10 36 12 36 L28 36 Q30 36 30 34 L30 14 L32 16 L36 10 L28 4 Q24 8 20 8 Q16 8 12 4 Z"
                    fill="#7c3aed"
                    stroke="#a78bfa"
                    strokeWidth="1"
                />
                <text x="20" y="26" textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff" fontFamily="sans-serif">
                    {number}
                </text>
            </svg>
        </Box>
    );
}

export function PlayersPageView({
    players,
    canCreate,
    canEdit,
    canDelete,
    sortField,
    sortAsc,
    onSort,
    firstName,
    lastName,
    nationality,
    dateOfBirth,
    position,
    heightCm,
    jerseyNumber,
    preferredFoot,
    photoUrl,
    formError,
    onFirstNameChange,
    onLastNameChange,
    onNationalityChange,
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
    editNationality,
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
    onEditNationalityChange,
    onEditDateOfBirthChange,
    onEditPositionChange,
    onEditHeightCmChange,
    onEditJerseyNumberChange,
    onEditPreferredFootChange,
    onEditPhotoSelect,
    onSaveEdit,
    onCancelEdit,
    deleteDialogOpen,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
}: PlayersPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">
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
                        <Autocomplete
                            options={COUNTRIES}
                            getOptionLabel={(option) => option.name}
                            value={COUNTRIES.find((c) => c.code === nationality) ?? null}
                            onChange={(_, newValue: Country | null) => onNationalityChange(newValue?.code ?? null)}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.code} sx={{ display: "flex", gap: 1}}>
                                    <span className={`fi fi-${option.code}`} />
                                    {option.name}
                                </Box>
                            )}
                            renderInput={(params) => <TextField {...params} label="Narodowość" />}
                            sx={{ minWidth: 220 }}
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
                            select
                            label="Pozycja"
                            value={position}
                            onChange={(e) => onPositionChange(e.target.value)}
                            required
                            sx={{ minWidth: 160 }}
                        >
                            {POSITIONS.map((p) => (
                                <MenuItem key={p} value={p}>{POSITION_LABELS[p]}</MenuItem>
                            ))}
                        </TextField>
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

            <Dialog open={editingId !== null} onClose={onCancelEdit} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={(e) => { e.preventDefault(); if (editingId !== null) onSaveEdit(editingId); }}>
                    <DialogTitle>Edytuj zawodnika</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1 }}>
                        <TextField
                            label="Imię"
                            value={editFirstName}
                            onChange={(e) => onEditFirstNameChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Nazwisko"
                            value={editLastName}
                            onChange={(e) => onEditLastNameChange(e.target.value)}
                            required
                        />
                        <Autocomplete
                            options={COUNTRIES}
                            getOptionLabel={(option) => option.name}
                            value={COUNTRIES.find((c) => c.code === editNationality) ?? null}
                            onChange={(_, newValue: Country | null) => onEditNationalityChange(newValue?.code ?? null)}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.code} sx={{ display: "flex", gap: 1}}>
                                    <span className={`fi fi-${option.code}`} />
                                    {option.name}
                                </Box>
                            )}
                            renderInput={(params) => <TextField {...params} label="Narodowość" />}
                            sx={{ minWidth: 220 }}
                        />
                        <TextField
                            label="Data urodzenia"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={editDateOfBirth}
                            onChange={(e) => onEditDateOfBirthChange(e.target.value)}
                            required
                        />
                        <TextField
                            select
                            label="Pozycja"
                            value={editPosition}
                            onChange={(e) => onEditPositionChange(e.target.value)}
                            required
                            sx={{ minWidth: 160 }}
                        >
                            {POSITIONS.map((p) => (
                                <MenuItem key={p} value={p}>{POSITION_LABELS[p]}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Wzrost (cm)"
                            type="number"
                            value={editHeightCm}
                            onChange={(e) => onEditHeightCmChange(e.target.value)}
                        />
                        <TextField
                            label="Numer"
                            type="number"
                            value={editJerseyNumber}
                            onChange={(e) => onEditJerseyNumberChange(e.target.value)}
                        />
                        <TextField
                            select
                            label="Noga"
                            value={editPreferredFoot}
                            onChange={(e) => onEditPreferredFootChange(e.target.value)}
                            sx={{ minWidth: 120 }}
                        >
                            <MenuItem value="">-</MenuItem>
                            {FEET.map((f) => (
                                <MenuItem key={f} value={f}>{FOOT_LABELS[f]}</MenuItem>
                            ))}
                        </TextField>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {editPhotoUrl && <Avatar src={`${BACKEND_ORIGIN}${editPhotoUrl}`} />}
                            <Button component="label" variant="outlined" size="small">
                                Zmień zdjęcie
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onEditPhotoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCancelEdit}>Anuluj</Button>
                        <Button type="submit" variant="contained">Zapisz zmiany</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                title="Usunąć zawodnika?"
                message="Usunięcie tego zawodnika skasuje też jego historię kariery i raporty. Jeśli zawodnik ma zarejestrowane zdarzenia meczowe, usunięcie może się nie powieść."
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />

            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Zdjęcie</TableCell>
                            <TableCell>Imię</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "lastName"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => onSort("lastName")}
                                >
                                    Nazwisko
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Narodowość</TableCell>
                            <TableCell>Data urodzenia</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "position"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => onSort("position")}
                                >
                                    Pozycja
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Wzrost</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === "jerseyNumber"}
                                    direction={sortAsc ? "asc" : "desc"}
                                    onClick={() => onSort("jerseyNumber")}
                                >
                                    Numer
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Noga</TableCell>
                            {(canEdit || canDelete) && <TableCell>Akcje</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell>
                                    {player.photoUrl ? (
                                        <Avatar src={`${BACKEND_ORIGIN}${player.photoUrl}`} />
                                    ) : (
                                        <Avatar>{player.firstName[0]}{player.lastName[0]}</Avatar>
                                    )}
                                </TableCell>
                                <TableCell>{player.firstName}</TableCell>
                                <TableCell>{player.lastName}</TableCell>
                                <TableCell>
                                    {player.nationality ? (
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <span className={`fi fi-${player.nationality}`} />
                                            {COUNTRIES.find((c) => c.code === player.nationality)?.name ?? player.nationality}
                                        </Box>
                                    ) : "-"}
                                </TableCell>
                                <TableCell>{player.dateOfBirth}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={POSITION_LABELS[player.position] ?? player.position}
                                        size="small"
                                        sx={{ bgcolor: positionChipStyle(player.position).bg, color: positionChipStyle(player.position).color }}
                                    />                                        
                                </TableCell>
                                <TableCell>{player.heightCm ?? "-"}</TableCell>
                                <TableCell><JerseyNumber number={player.jerseyNumber} /></TableCell>
                                <TableCell>{renderFoot(player.preferredFoot)}</TableCell>
                                {(canEdit || canDelete) && (
                                    <TableCell>
                                        <Box sx={{ display: "flex", gap: 1 }}>
                                            {canEdit && <Button size="small" onClick={() => onStartEdit(player)}>Edytuj</Button>}
                                            {canDelete && <Button size="small" color="error" onClick={() => onRequestDelete(player.id)}>Usuń</Button>}
                                        </Box>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}