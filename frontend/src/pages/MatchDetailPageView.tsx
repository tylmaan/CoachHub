import { 
    Box, 
    Typography, 
    Avatar, 
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton,
    Alert,
    FormControlLabel,
    Switch, 
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
import { MATCH_TYPE_LABELS, POSITION_LABELS } from "../constants/labels";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

interface MatchDetailPageViewProps {
    match: Match;
    players: Player[];
    appearances: MatchAppearance[];
    availablePlayers: Player[];
    rosterOpen: boolean;
    newPlayerId: number | "";
    newIsStarting: boolean;
    rosterError: string | null;
    onOpenRoster: () => void;
    onCloseRoster: () => void;
    onNewPlayerIdChange: (value: number | "") => void;
    onNewIsStartingChange: (value: boolean) => void;
    onAddAppearance: (e: React.SyntheticEvent) => void;
    onRemoveAppearance: (appearanceId: number) => void;
}

export function MatchDetailPageView({ 
    match,
    players,
    appearances,
    availablePlayers,
    rosterOpen,
    newPlayerId,
    newIsStarting,
    rosterError,
    onOpenRoster,
    onCloseRoster,
    onNewPlayerIdChange,
    onNewIsStartingChange,
    onAddAppearance,
    onRemoveAppearance,
}: MatchDetailPageViewProps) {
    function playerFor(appearance: MatchAppearance): Player | undefined {
        return players.find((p) => p.id === appearance.playerId);
    }

    const starters = appearances.filter((a) => a.isStarting);
    const substitutes = appearances.filter((a) => !a.isStarting);
    
    function renderRosterList(list: MatchAppearance[]) {
        return (
            <List dense>
                {list.map((appearance) => {
                    const player = playerFor(appearance);
                    return (
                        <ListItem 
                        key={appearance.id}
                        secondaryAction={
                            <IconButton edge="end" onClick={() => onRemoveAppearance(appearance.id)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        }
                        >
                            <ListItemAvatar>
                                {player?.photoUrl ? (
                                    <Avatar src={`${BACKEND_ORIGIN}${player.photoUrl}`} />
                                ) : (
                                    <Avatar>{player?.firstName[0] ?? "?"}</Avatar>
                                )}
                            </ListItemAvatar>
                            <ListItemText
                                primary={player ? `${player.firstName} ${player.lastName}` : "Nieznany zawodnik"}
                                secondary={player ? POSITION_LABELS[player.position] ?? player.position : undefined}
                            />
                        </ListItem>
                    );
                })}
            </List>
        );
    }

    return (
        <Box>
            <Paper sx={{ p: 3, mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
                {match.opponentLogoUrl ? (
                    <Avatar src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`} variant="rounded" sx={{ width: 56, height: 56 }} />
                ) : (
                    <Avatar variant="rounded" sx={{ width: 56, height: 56 }}>{match.opponent[0]}</Avatar>
                )}
                <Box>
                    <Typography variant="h5">{match.opponent}</Typography>
                    <Typography variant="body2" color="textSecondary">
                        {match.date} &middot; {match.season}
                        {match.matchType && ` ·  ${MATCH_TYPE_LABELS[match.matchType] ?? match.matchType}`}
                        {match.round && ` · ${match.round}`}
                        {match.isHome !== null && ` · ${match.isHome ? "Dom" : "Wyjazd"}`} 
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="h4">
                    {match.scoreFor ?? "-"} : {match.scoreAgainst ?? "-"}
                </Typography>
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Skład</Typography>
                <Button variant="contained" onClick={onOpenRoster}>
                    Dodaj zawodnika
                </Button>
            </Box>

            {rosterError && <Alert severity="error" sx={{ mb: 2 }}>{rosterError}</Alert>}

            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Wyjściowy skład</Typography>
                    {renderRosterList(starters)}
                </Paper>
                <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>Rezerwowi</Typography>
                    {renderRosterList(substitutes)}
                </Paper>
            </Box>

            <Dialog open={rosterOpen} onClose={onCloseRoster} fullWidth maxWidth="xs">
                <Box component="form" onSubmit={onAddAppearance}>
                    <DialogTitle>Dodaj do skladu</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <TextField
                            select
                            label="Zawodnik"
                            value={newPlayerId}
                            onChange={(e) => onNewPlayerIdChange(Number(e.target.value))}
                            required
                        >
                            {availablePlayers.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.firstName} {p.lastName}
                                </MenuItem>
                            ))}
                        </TextField>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={newIsStarting}
                                    onChange={(e) => onNewIsStartingChange(e.target.checked)}
                                /> 
                            }
                            label={newIsStarting ? "Podstawowy" : "Rezerwowy"}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseRoster}>Anuluj</Button>
                        <Button type="submit" variant="contained">Dodaj</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </Box>
    );
}