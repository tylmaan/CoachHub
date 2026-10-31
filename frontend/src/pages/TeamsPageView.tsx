import {
    Typography,
    Alert,
    Box,
    TextField,
    Button,
    Avatar,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Autocomplete,
} from '@mui/material';
import type { TeamSummary } from '../types/team';
import { BACKEND_ORIGIN } from '../api/axiosInstance';
import { ROLE_LABELS } from '../constants/labels';
import { COUNTRIES } from '../constants/countries';
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog';
import { KitEditor } from '../components/KitEditor';
import { Jersey } from "../components/Jersey";
import type { TeamKits } from '../types/kit';
import type { Country } from '../constants/countries';

interface TeamsPageViewProps {
    teams: TeamSummary[];
    isAdmin: boolean;
    canEdit: boolean;
    canDelete: boolean;

    name: string;
    countryCode: string | null;
    logoUrl: string | null;
    kits: TeamKits;
    formError: string | null;
    onNameChange: (value: string) => void;
    onCountryCodeChange: (value: string | null) => void;
    onLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKitsChange: (kits: TeamKits) => void;
    onCreate: (e: React.SyntheticEvent) => void;
    createOpen: boolean;
    onOpenCreate: () => void;
    onCloseCreate: () => void;
    
    editingId: number | null;
    editName: string;
    editCountryCode: string | null;
    editLogoUrl: string | null;
    editKits: TeamKits;
    actionError: string | null;
    onStartEdit: (team: TeamSummary) => void;
    onEditNameChange: (value: string) => void;
    onEditCountryCodeChange: (value: string | null) => void;
    onEditLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onEditKitsChange: (kits: TeamKits) => void;
    onSaveEdit: (teamId: number) => void;
    onCancelEdit: () => void;
    deleteDialogOpen: boolean;
    onRequestDelete: (teamId: number) => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
}

export function TeamsPageView({
    teams,
    isAdmin,
    canEdit,
    canDelete,
    name,
    countryCode,
    logoUrl,
    kits,
    formError,
    onNameChange,
    onCountryCodeChange,
    onLogoSelect,
    onKitsChange,
    onCreate,
    createOpen,
    onOpenCreate,
    onCloseCreate,
    editingId,
    editName,
    editCountryCode,
    editLogoUrl,
    editKits,
    actionError,
    onStartEdit,
    onEditNameChange,
    onEditCountryCodeChange,
    onEditLogoSelect,
    onEditKitsChange,
    onSaveEdit,
    onCancelEdit,
    deleteDialogOpen,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete,
}: TeamsPageViewProps) {
     return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Drużyny
            </Typography>

            {isAdmin && (
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                    <Button variant="contained" onClick={onOpenCreate}>
                        Dodaj drużynę
                    </Button>
                </Box>
            )}

            {actionError && <Alert severity="error" sx={{ mb:2 }}>{actionError}</Alert>}

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 2 }}>
                {teams.map((team) => {
                    const coach = team.staffMembers.find((m) => m.roles.includes("Coach"));
                    const otherStaff = team.staffMembers.filter((m) => m !== coach);
                    return (
                        <Box key={team.id} sx={{ bgcolor: "background.paper", borderRadius: 3, p: 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                                {team.logoUrl ? (
                                    <Avatar src={`${BACKEND_ORIGIN}${team.logoUrl}`} variant="rounded" sx={{ width: 44, height: 44 }} />
                                ) : (
                                    <Avatar variant="rounded" sx={{ width: 44, height: 44 }}>{team.name[0]}</Avatar>
                                )}
                                <Typography variant="subtitle1">{team.name}</Typography>
                                {team.countryCode && <span className={`fi fi-${team.countryCode}`} />}
                            </Box>

                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: 1.5,
                                    borderTop: "1px solid",
                                    borderColor: "divider",
                                    pt: 1,
                                    mb: 1,
                                }}
                            >
                                <Jersey kit={team.homeKit} number={null} size={40} />
                                <Jersey kit={team.awayKit} number={null} size={40} />
                                <Jersey kit={team.goalkeeperKit} number={null} size={40} />
                            </Box>

                            <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1, mb: 1 }}>
                                <Typography variant="caption" color="text.secondary">TRENER</Typography>
                                {coach ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                                        {coach.photoUrl ? (
                                            <Avatar src={`${BACKEND_ORIGIN}${coach.photoUrl}`} sx={{ width: 26, height: 26 }} />
                                        ) : (
                                            <Avatar sx={{ width: 26, height: 26, fontSize: 12 }}>{(coach.fullName ?? coach.email)[0]}</Avatar>
                                        )}
                                        <Typography variant="body2">{coach.fullName ?? coach.email}</Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Brak przypisanego trenera</Typography>
                                )}
                            </Box>

                            <Box>
                                <Typography variant="caption" color="text.secondary">SZTAB</Typography>
                                {otherStaff.length > 0 ? (
                                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                                        {otherStaff.map((m) => (
                                            <Chip
                                                key={m.id}
                                                size="small"
                                                label={`${m.fullName ?? m.email} (${ROLE_LABELS[m.roles[0]] ?? m.roles[0]})`}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">Brak</Typography>
                                )}
                            </Box>

                            {(canEdit || canDelete) && (
                                <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                                    {canEdit && <Button size="small" onClick={() => onStartEdit(team)}>Edytuj</Button>}
                                    {canDelete && <Button size="small" color="error" onClick={() => onRequestDelete(team.id)}>Usuń</Button>}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>

            <Dialog open={createOpen} onClose={onCloseCreate} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={onCreate}>
                    <DialogTitle>Nowa drużyna</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField
                            label="Nazwa"
                            value={name}
                            onChange={(e) => onNameChange(e.target.value)}
                            required
                        />
                        <Autocomplete
                            options={COUNTRIES}
                            getOptionLabel={(option) => option.name}
                            value={COUNTRIES.find((c) => c.code === countryCode) ?? null}
                            onChange={(_, newValue: Country | null) => onCountryCodeChange(newValue?.code ?? null)}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.code} sx={{ display: "flex", gap: 1 }}>
                                    <span className={`fi fi-${option.code}`} />
                                    {option.name}
                                </Box>
                            )}
                            renderInput={(params) => <TextField {...params} label="Kraj" />}
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {logoUrl && <Avatar src={`${BACKEND_ORIGIN}${logoUrl}`} variant="rounded" />}
                            <Button component="label" variant="outlined">
                                Wybierz logo
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onLogoSelect} />
                            </Button>
                        </Box>
                        <KitEditor
                            label="Koszulka domowa"
                            kit={kits.homeKit}
                            onChange={(homeKit) => onKitsChange({ ...kits, homeKit })}
                        />
                        <KitEditor
                            label="Koszulka wyjazdowa"
                            kit={kits.awayKit}
                            onChange={(awayKit) => onKitsChange({ ...kits, awayKit })}
                        />
                        <KitEditor
                            label="Koszulka bramkarza"
                            kit={kits.goalkeeperKit}
                            onChange={(goalkeeperKit) => onKitsChange({ ...kits, goalkeeperKit })}
                            solidOnly
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseCreate}>Anuluj</Button>
                        <Button type="submit" variant="contained">Dodaj</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={editingId !== null} onClose={onCancelEdit} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={(e) => { e.preventDefault(); if (editingId !== null) onSaveEdit(editingId); }}>
                    <DialogTitle>Edytuj drużynę</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <TextField
                            label="Nazwa"
                            value={editName}
                            onChange={(e) => onEditNameChange(e.target.value)}
                            required
                        />
                        <Autocomplete
                            options={COUNTRIES}
                            getOptionLabel={(option) => option.name}
                            value={COUNTRIES.find((c) => c.code === editCountryCode) ?? null}
                            onChange={(_, newValue: Country | null) => onEditCountryCodeChange(newValue?.code ?? null)}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.code} sx={{ display: "flex", gap: 1 }}>
                                    <span className={`fi fi-${option.code}`} />
                                    {option.name}
                                </Box>
                            )}
                            renderInput={(params) => <TextField {...params} label="Kraj" />}
                        />
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {editLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${editLogoUrl}`} variant="rounded" />}
                            <Button component="label" variant="outlined">
                                Zmień logo
                                <input type="file" accept="image/png,image/jpeg" hidden onChange={onEditLogoSelect} />
                            </Button>
                        </Box>
                        <KitEditor
                            label="Koszulka domowa"
                            kit={editKits.homeKit}
                            onChange={(homeKit) => onEditKitsChange({ ...editKits, homeKit })}
                        />
                        <KitEditor
                            label="Koszulka wyjazdowa"
                            kit={editKits.awayKit}
                            onChange={(awayKit) => onEditKitsChange({ ...editKits, awayKit })}
                        />
                        <KitEditor
                            label="Koszulka bramkarza"
                            kit={editKits.goalkeeperKit}
                            onChange={(goalkeeperKit) => onEditKitsChange({ ...editKits, goalkeeperKit })}
                            solidOnly
                        />                    
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCancelEdit}>Anuluj</Button>
                        <Button type="submit" variant="contained">Zapisz</Button>
                    </DialogActions>
                </Box>
            </Dialog>
            
            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                title="Usunąć drużynę?"
                message="Usunięcie tej drużyny skasuje też wszystkich jej zawodników, mecze, schematy taktyczne i raporty. Tej operacji nie można cofnąć."
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />
        </>
    );
}