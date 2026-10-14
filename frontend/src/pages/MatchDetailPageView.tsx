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
    ListItemIcon,
    IconButton,
    Alert,
    FormControlLabel,
    Switch, 
    Divider,
    ToggleButtonGroup,
    ToggleButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import StarIcon from "@mui/icons-material/Star";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import BlockIcon from "@mui/icons-material/Block";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
import type { MatchEvent } from "../types/matchEvent";
import { MATCH_TYPE_LABELS, POSITION_LABELS, EVENT_TYPE_LABELS } from "../constants/labels";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

const EVENT_TYPES = ["Goal", "OwnGoal", "Assist", "YellowCard", "RedCard", "SubstitutionIn", "SubstitutionOff", "PenaltyMissed"];

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
    rosterPlayers: Player[];
    events: MatchEvent[];
    eventOpen: boolean;
    newEventTeam: string;
    newEventType: string;
    newEventMinute: string;
    newEventPlayerId: number | "";
    newEventOpponentName: string;
    eventError: string | null;
    onOpenEvent: () => void;
    onCloseEvent: () => void;
    onNewEventTeamChange: (value: string) => void;
    onNewEventTypeChange: (value: string) => void;
    onNewEventMinuteChange: (value: string) => void;
    onNewEventPlayerIdChange: (value: number | "") => void;
    onNewEventOpponentNameChange: (value: string) => void;
    onAddEvent: (e: React.SyntheticEvent) => void;
    onRemoveEvent: (eventId: number) => void;
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
    rosterPlayers,
    events,
    eventOpen,
    newEventTeam,
    newEventType,
    newEventMinute,
    newEventPlayerId,
    newEventOpponentName,
    eventError,
    onOpenEvent,
    onCloseEvent,
    onNewEventTeamChange,
    onNewEventTypeChange,
    onNewEventMinuteChange,
    onNewEventPlayerIdChange,
    onNewEventOpponentNameChange,
    onAddEvent,
    onRemoveEvent,
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

    function eventTypeIcon(eventType: string) {
        if (eventType === "Goal") return <SportsSoccerIcon sx={{ color: "success.main" }} fontSize="small" />;
        if (eventType === "OwnGoal") return <SportsSoccerIcon sx={{ color: "error.main" }} fontSize="small" />;
        if (eventType === "Assist") return <StarIcon sx={{ color: "info.main" }} />;
        if (eventType === "YellowCard") return <Box sx={{ width: 12, height: 16, bgcolor: "#fdd835", borderRadius: 0.5 }} />;
        if (eventType === "RedCard") return <Box sx={{ width: 12, height: 16, bgcolor: "#d32f2f", borderRadius: 0.5 }} />;
        if (eventType === "SubstitutionIn") return <ArrowCircleUpIcon sx={{ color: "success.main" }} fontSize="small" />;
        if (eventType === "SubstitutionOff") return <ArrowCircleDownIcon sx={{ color: "error.main" }} fontSize="small" />;
        if (eventType === "PenaltyMissed") return <BlockIcon sx={{ color: "error.main" }} fontSize="small" />;
        return null;
    }

    function eventPlayerName(event: MatchEvent): string {
        if (event.team === "Opponent") {
            return event.opponentPlayerName ?? "Rywal";
        }
        const player = players.find((p) => p.id === event.playerId);
        return player ? `${player.firstName} ${player.lastName}` : "Nieznany zawodnik";
    }

    function renderEventRow(event: MatchEvent) {
        return (
            <ListItem
                key={event.id}
                secondaryAction={
                    <IconButton edge="end" onClick={() => onRemoveEvent(event.id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                }
            >
                <ListItemIcon>{eventTypeIcon(event.eventType)}</ListItemIcon>
                <ListItemText
                    primary={`${event.minute ?? "-"}' ${eventPlayerName(event)}`}
                    secondary={`${EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}${event.team === "Opponent" ? " (Rywal)" : ""}`}
                />
            </ListItem>
        );
    }

    const sortedEvents = [...events].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
    const firstHalf = sortedEvents.filter((e) => e.minute !== null && e.minute <= 45);
    const secondHalf = sortedEvents.filter((e) => e.minute !== null && e.minute > 45 && e.minute <= 90);
    const extraTime = sortedEvents.filter((e) => e.minute !== null && e.minute > 90);
    const noMinute = sortedEvents.filter((e) => e.minute === null);

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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, mt: 4 }}>
                <Typography variant="h6">Zdarzenia meczowe</Typography>
                <Button variant="contained" onClick={onOpenEvent}>
                    Dodaj zdarzenie
                </Button>
            </Box>

            {eventError && <Alert severity="error" sx={{ mb: 2 }}>{eventError}</Alert>}

            <Paper sx={{ p: 2 }}>
                <List dense>
                    {firstHalf.length > 0 && (
                        <>
                            <Typography variant="overline" color="text.secondary">1. połowa</Typography>
                            {firstHalf.map(renderEventRow)}
                        </>
                    )}
                    {secondHalf.length > 0 && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="overline" color="text.secondary">2. połowa</Typography>
                            {secondHalf.map(renderEventRow)}
                        </>
                    )}
                    {extraTime.length > 0 && (
                        <>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="overline" color="text.secondary">Dogrywka</Typography>
                            {extraTime.map(renderEventRow)}
                        </>
                    )}
                    {noMinute.map(renderEventRow)}
                    {sortedEvents.length === 0 && (
                        <Typography variant="body2" color="text.secondary">Brak zdarzeń.</Typography>
                    )}
                </List>
            </Paper>

            <Dialog open={eventOpen} onClose={onCloseEvent} fullWidth maxWidth="xs">
                <Box component="form" onSubmit={onAddEvent}>
                    <DialogTitle>Dodaj zdarzenie</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        <ToggleButtonGroup
                            value={newEventTeam}
                            exclusive
                            onChange={(_, value) => value && onNewEventTeamChange(value)}
                            fullWidth
                        >
                            <ToggleButton value="Us">Nasza drużyna</ToggleButton>
                            <ToggleButton value="Opponent">Rywal</ToggleButton>
                        </ToggleButtonGroup>

                        {newEventTeam === "Us" ? (
                            <TextField
                                select
                                label="Zawodnik"
                                value={newEventPlayerId}
                                onChange={(e) => onNewEventPlayerIdChange(Number(e.target.value))}
                                required
                            >
                                {rosterPlayers.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <TextField
                                label="Nazwisko zawodnika rywala (opcjonalnie)"
                                value={newEventOpponentName}
                                onChange={(e) => onNewEventOpponentNameChange(e.target.value)}
                            />
                        )}

                        <TextField
                            select
                            label="Typ zdarzenia"
                            value={newEventType}
                            onChange={(e) => onNewEventTypeChange(e.target.value)}
                            required
                        >
                            {EVENT_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Minuta"
                            type="number"
                            value={newEventMinute}
                            onChange={(e) => onNewEventMinuteChange(e.target.value)}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseEvent}>Anuluj</Button>
                        <Button type="submit" variant="contained">Dodaj</Button>
                    </DialogActions>
                </Box>
            </Dialog>   
        </Box>
    );
}