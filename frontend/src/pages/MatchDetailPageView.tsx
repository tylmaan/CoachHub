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
    IconButton,
    Alert,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Tabs,
    Tab,
    Checkbox,
    FormControlLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import StarIcon from "@mui/icons-material/Star";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import BlockIcon from "@mui/icons-material/Block";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AdjustIcon from "@mui/icons-material/Adjust";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
import type { MatchEvent } from "../types/matchEvent";
import { MATCH_TYPE_LABELS, POSITION_LABELS, EVENT_TYPE_LABELS, POSITIONS, POSITION_GROUPS } from "../constants/labels";
import { FORMATIONS, FORMATION_LABELS, type FormationSlot } from "../constants/formations";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

const EVENT_TYPES = ["Goal", "OwnGoal", "YellowCard", "RedCard", "Substitution", "PenaltyMissed"];
const BENCH_SIZE = 12;

interface MatchDetailPageViewProps {
    match: Match;
    players: Player[];
    appearances: MatchAppearance[];
    availablePlayers: Player[];
    rosterPlayers: Player[];
    rosterError: string | null;
    formation: string;
    onFormationChange: (value: string) => void;
    pickerOpen: boolean;
    pickerIsStarting: boolean;
    pickerPosition: string | null;
    pickerTab: number;
    onPickerTabChange: (value: number) => void;
    pickerHasAppearance: boolean;
    onOpenPitchPicker: (pos: string, slotKey: string, appearance: MatchAppearance | null) => void;
    onOpenBenchPicker: (appearance: MatchAppearance | null) => void;
    onClosePicker: () => void;
    onPickPlayer: (playerId: number) => void;
    onRemoveFromPicker: () => void;
    events: MatchEvent[];
    eventOpen: boolean;
    newEventTeam: string;
    newEventType: string;
    newEventMinute: string;
    newEventPlayerId: number | "";
    newEventOpponentName: string;
    newEventIsPenalty: boolean;
    onNewEventIsPenaltyChange: (value: boolean) => void;
    newEventAssistPlayerId: number | "";
    onNewEventAssistPlayerIdChange: (value: number | "") => void;
    newEventAssistOpponentName: string;
    onNewEventAssistOpponentNameChange: (value: string) => void;
    newEventSecondPlayerId: number | "";
    onNewEventSecondPlayerIdChange: (value: number | "") => void;
    newEventSecondOpponentName: string;
    onNewEventSecondOpponentNameChange: (value: string) => void;
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

function Jersey({ number, muted }: { number: number | null; muted?: boolean }) {
    return (
        <svg width="56" height="56" viewBox="0 0 40 40">
            <path
                d="M12 4 L4 10 L8 16 L10 14 L10 34 Q10 36 12 36 L28 36 Q30 36 30 34 L30 14 L32 16 L36 10 L28 4 Q24 8 20 8 Q16 8 12 4 Z"
                fill={muted ? "none" : "#7c3aed"}
                stroke={muted ? "rgba(255,255,255,0.6)" : "#a78bfa"}
                strokeWidth="1"
                strokeDasharray={muted ? "3 2" : undefined}
            />
            {number !== null && (
                <text x="20" y="26" textAnchor="middle" fontSize="12" fontWeight="600" fill="#ffffff" fontFamily="sans-serif">
                    {number}
                </text>
            )}
        </svg>
    );
}

function renderPlayerOption(p: Player) {
    return (
        <MenuItem key={p.id} value={p.id}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                    src={p.photoUrl ? `${BACKEND_ORIGIN}${p.photoUrl}` : undefined}
                    sx={{ width: 24, height: 24, fontSize: 12 }}
                >
                    {p.firstName[0]}
                </Avatar>
                <span>{p.firstName} {p.lastName}</span>
            </Box>
        </MenuItem>
    );
}

export function MatchDetailPageView({ 
    match,
    players,
    appearances,
    availablePlayers,
    rosterError,
    formation,
    onFormationChange,
    pickerOpen,
    pickerIsStarting,
    pickerPosition,
    pickerTab,
    onPickerTabChange,
    pickerHasAppearance,
    onOpenPitchPicker,
    onOpenBenchPicker,
    onClosePicker,
    onPickPlayer,
    onRemoveFromPicker,
    rosterPlayers,
    events,
    eventOpen,
    newEventTeam,
    newEventType,
    newEventMinute,
    newEventPlayerId,
    newEventOpponentName,
    newEventIsPenalty,
    onNewEventIsPenaltyChange,
    newEventAssistPlayerId,
    onNewEventAssistPlayerIdChange,
    newEventAssistOpponentName,
    onNewEventAssistOpponentNameChange,
    newEventSecondPlayerId,
    onNewEventSecondPlayerIdChange,
    newEventSecondOpponentName,
    onNewEventSecondOpponentNameChange,
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

    function buildPitchSlots(code: string): { pos: string; x: number; y: number, slotKey: string; appearance: MatchAppearance | null }[] {
        return (FORMATIONS[code] ?? []).map(([pos, x, y]: FormationSlot, i: number) => {
            const slotKey = `${pos}-${i}`;
            const appearance = appearances.find((a) => a.isStarting && a.position === slotKey) ?? null;
            return { pos, x, y, slotKey, appearance };
        });
    } 

    const pitchSlots = buildPitchSlots(formation);
    const benchAppearances = appearances.filter((a) => !a.isStarting);
    const benchTiles = Array.from({ length: BENCH_SIZE }, (_, i) => benchAppearances[i] ?? null);
    const sortedAvailable = [...availablePlayers].sort((a, b) => POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position)); 

        function eventTypeIcon(eventType: string, isSecondYellow?: boolean) {
        if (eventType === "Goal") return <SportsSoccerIcon sx={{ color: "success.main" }} fontSize="small" />;
        if (eventType === "PenaltyGoal") return <AdjustIcon sx={{ color: "success.main" }} fontSize="small" />;
        if (eventType === "OwnGoal") return <SportsSoccerIcon sx={{ color: "error.main" }} fontSize="small" />;
        if (eventType === "Assist") return <StarIcon sx={{ color: "info.main" }} />;
        if (eventType === "YellowCard" && isSecondYellow) {
            return (
                <Box sx={{ display: "flex", gap: 0.3 }}>
                    <Box sx={{ width: 10, height: 14, bgcolor: "#fdd835", borderRadius: 0.5 }} />
                    <Box sx={{ width: 10, height: 14, bgcolor: "#d32f2f", borderRadius: 0.5 }} />
                </Box>
            );
        }
        if (eventType === "YellowCard") return <Box sx={{ width: 12, height: 16, bgcolor: "#fdd835", borderRadius: 0.5 }} />;
        if (eventType === "RedCard") return <Box sx={{ width: 12, height: 16, bgcolor: "#d32f2f", borderRadius: 0.5 }} />;
        if (eventType === "SubstitutionIn") return <ArrowCircleUpIcon sx={{ color: "success.main" }} fontSize="small" />;
        if (eventType === "SubstitutionOff") return <ArrowCircleDownIcon sx={{ color: "error.main" }} fontSize="small" />;
        if (eventType === "PenaltyMissed") return <BlockIcon sx={{ color: "error.main" }} fontSize="small" />;
        return <SwapHorizIcon sx={{ color: "text.secondary" }} fontSize="small" />;
    }

    function eventPlayerName(event: MatchEvent): string {
        if (event.team === "Opponent") {
            return event.opponentPlayerName ?? "Rywal";
        }
        const player = players.find((p) => p.id === event.playerId);
        return player ? `${player.firstName} ${player.lastName}` : "Nieznany zawodnik";
    }

    function isSecondYellowCard(event: MatchEvent, allSorted: MatchEvent[]): boolean {
        if (event.eventType !== "YellowCard") return false;
        const sameCard = allSorted.filter((e) =>
            e.eventType === "YellowCard" &&
            e.team === event.team &&
            (event.team === "Us" ? e.playerId === event.playerId : e.opponentPlayerName === event.opponentPlayerName)
        );
        return sameCard.findIndex((e) => e.id === event.id) >= 1;
    }

    interface DisplayEvent {
        primary: MatchEvent;
        secondary?: MatchEvent;
    }

    function buildDisplayEvents(sorted: MatchEvent[]): DisplayEvent[] {
        const used = new Set<number>();
        const result: DisplayEvent[] = [];
        for (const event of sorted) {
            if (used.has(event.id)) continue;
            if (event.eventType === "Goal" || event.eventType === "PenaltyGoal") {
                const assist = sorted.find((e) =>
                    !used.has(e.id) && e.id !== event.id && e.eventType === "Assist" &&
                    e.team === event.team && e.minute === event.minute
                );
                if (assist) used.add(assist.id);
                used.add(event.id);
                result.push({ primary: event, secondary: assist });
            } else if (event.eventType === "SubstitutionOff") {
                const subIn = sorted.find((e) =>
                    !used.has(e.id) && e.id !== event.id && e.eventType === "SubstitutionIn" &&
                    e.team === event.team && e.minute === event.minute
                );
                if (subIn) used.add(subIn.id);
                used.add(event.id);
                result.push({ primary: event, secondary: subIn });
            } else if (event.eventType === "Assist" || event.eventType === "SubstitutionIn") {
                continue;
            } else {
                used.add(event.id);
                result.push({ primary: event });
            }
        }
        for (const event of sorted) {
            if (used.has(event.id)) continue;
            used.add(event.id);
            result.push({ primary: event });
        }
        return result;
    }

    function displayLabel(de: DisplayEvent): string {
        const primaryName = eventPlayerName(de.primary);
        if ((de.primary.eventType === "Goal" || de.primary.eventType === "PenaltyGoal") && de.secondary) {
            return `${primaryName} (asysta: ${eventPlayerName(de.secondary)})`;
        }
        if (de.primary.eventType === "SubstitutionOff" && de.secondary) {
            return `${primaryName} ↓ / ${eventPlayerName(de.secondary)} ↑`;
        }
        return primaryName;
    }

    function displayTypeLabel(de: DisplayEvent, sorted: MatchEvent[]): string {
        if (de.primary.eventType === "SubstitutionOff" && de.secondary) return "Zmiana";
        if (de.primary.eventType === "YellowCard" && isSecondYellowCard(de.primary, sorted)) return "Druga żółta (czerwona)";
        return EVENT_TYPE_LABELS[de.primary.eventType] ?? de.primary.eventType;
    }

    function renderDisplayEvent(de: DisplayEvent, sorted: MatchEvent[]) {
        const isOpponent = de.primary.team === "Opponent";
        const second = de.primary.eventType === "YellowCard" && isSecondYellowCard(de.primary, sorted);
        return (
            <Box
                key={de.primary.id}
                sx={{ display: "flex", justifyContent: isOpponent ? "flex-end" : "flex-start", mb: 0.5 }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexDirection: isOpponent ? "row-reverse" : "row",
                        maxWidth: "80%",
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={() => {
                            onRemoveEvent(de.primary.id);
                            if (de.secondary) onRemoveEvent(de.secondary.id);
                        }}
                    >
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                    {eventTypeIcon(de.primary.eventType, second)}
                    <Box sx={{ textAlign: isOpponent ? "right" : "left" }}>
                        <Typography variant="body2">
                            {de.primary.minute ?? "-"}&apos; {displayLabel(de)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {displayTypeLabel(de, sorted)}{isOpponent ? " (Rywal)" : ""}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    const sortedEvents = [...events].sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999));
    const displayEvents = buildDisplayEvents(sortedEvents);
    const firstHalf = displayEvents.filter((de) => de.primary.minute !== null && de.primary.minute <= 45);
    const secondHalf = displayEvents.filter((de) => de.primary.minute !== null && de.primary.minute > 45 && de.primary.minute <= 90);
    const extraTime = displayEvents.filter((de) => de.primary.minute !== null && de.primary.minute > 90);
    const noMinute = displayEvents.filter((de) => de.primary.minute === null);

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
                <TextField
                    select
                    size="small"
                    label="Formacja"
                    value={formation}
                    onChange={(e) => onFormationChange(e.target.value)}
                    sx={{ width: 160 }}
                >
                    {Object.keys(FORMATIONS).map((code) => (
                        <MenuItem key={code} value={code}>{FORMATION_LABELS[code]}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {rosterError && <Alert severity="error" sx={{ mb: 2 }}>{rosterError}</Alert>}

            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "7 / 5",
                    borderRadius: 2,
                    border: "0.5px solid rgba(255,255,255,0.2)",
                    overflow: "hidden",
                    background: "repeating-linear-gradient(0deg, rgba(99,153,34,0.18) 0 10%, rgba(99,153,34,0.08) 10% 20%), #3b6d11",
                    mb: 2,
                }}
            >
                <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", bgcolor: "rgba(255,255,255,0.5)" }} />
                <Box sx={{ position: "absolute", left: "50%", top: "50%", width: "15%", aspectRatio: "1 / 1", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
                <Box sx={{ position: "absolute", inset: "3%", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 1 }} />
                {pitchSlots.map((slot, i) => {
                    const player = slot.appearance ? playerFor(slot.appearance) : undefined;
                    return (
                        <Box
                            key={i}
                            onClick={() => onOpenPitchPicker(slot.pos, slot.slotKey, slot.appearance)}
                            sx={{
                                position: "absolute",
                                left: `${slot.x}%`,
                                top: `${slot.y}%`,
                                transform: "translate(-50%, -50%)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: 76,
                            }}
                        >
                            <Jersey number={player?.jerseyNumber ?? null} muted={!player} />
                            <Typography
                                variant="caption"
                                sx={{ color: "#fff", mt: 0.5, textAlign: "center", lineHeight: 1.1, maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {player ? player.lastName : slot.pos}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>Ławka rezerwowych</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                {benchTiles.map((appearance, i) => {
                    const player = appearance ? playerFor(appearance) : undefined;
                    return (
                        <Box
                            key={i}
                            onClick={() => onOpenBenchPicker(appearance)}
                            sx={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", width: 76 }}
                        >
                            <Jersey number={player?.jerseyNumber ?? null} muted={!player} />
                            <Typography
                                variant="caption"
                                sx={{ mt: 0.5, textAlign: "center", lineHeight: 1.1, maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                                {player ? player.lastName : ""}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>

            <Dialog open={pickerOpen} onClose={onClosePicker} fullWidth maxWidth="sm">
                <DialogTitle>
                    {pickerIsStarting ? `Pozycja: ${pickerPosition}` : "Ławka rezerwowych"}
                </DialogTitle>
                <DialogContent sx={{ pt: 1 }}>
                    <Tabs
                        value={pickerTab}
                        onChange={(_, value) => onPickerTabChange(value)}
                        variant="fullWidth"
                        sx={{ mb: 1 }}
                    >
                        {POSITION_GROUPS.map((group, i) => (
                            <Tab key={group.label} label={group.label} value={i} />
                        ))}
                    </Tabs>
                    <List dense sx={{ maxHeight: 320, overflowY: "auto" }}>
                        {sortedAvailable
                            .filter((p) => POSITION_GROUPS[pickerTab].codes.includes(p.position))
                            .map((p) => (
                                <ListItem key={p.id} disablePadding>
                                    <Button
                                        fullWidth
                                        sx={{ justifyContent: "space-between", textTransform: "none", px: 1.5 }}
                                        onClick={() => onPickPlayer(p.id)}
                                    >
                                        <span>{p.jerseyNumber ?? "-"} &nbsp; {p.firstName} {p.lastName}</span>
                                        <Typography variant="caption" color="text.secondary">
                                            {POSITION_LABELS[p.position] ?? p.position}
                                        </Typography>
                                    </Button>
                                </ListItem>
                            ))}
                        {sortedAvailable.filter((p) => POSITION_GROUPS[pickerTab].codes.includes(p.position)).length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ px: 1.5 }}>
                                Brak dostępnych zawodników w tej grupie.
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    {pickerHasAppearance && (
                        <Button color="error" onClick={onRemoveFromPicker}>
                            Usuń z tej pozycji
                        </Button>
                    )}
                    <Button onClick={onClosePicker}>Zamknij</Button>
                </DialogActions>
            </Dialog>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, mt: 4 }}>
                <Typography variant="h6">Zdarzenia meczowe</Typography>
                <Button variant="contained" onClick={onOpenEvent}>
                    Dodaj zdarzenie
                </Button>
            </Box>

            {eventError && <Alert severity="error" sx={{ mb: 2 }}>{eventError}</Alert>}

                        <Paper sx={{ p: 2 }}>
                {firstHalf.length > 0 && (
                    <>
                        <Typography variant="overline" color="text.secondary">1. połowa</Typography>
                        {firstHalf.map((de) => renderDisplayEvent(de, sortedEvents))}
                    </>
                )}
                {secondHalf.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="overline" color="text.secondary">2. połowa</Typography>
                        {secondHalf.map((de) => renderDisplayEvent(de, sortedEvents))}
                    </>
                )}
                {extraTime.length > 0 && (
                    <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="overline" color="text.secondary">Dogrywka</Typography>
                        {extraTime.map((de) => renderDisplayEvent(de, sortedEvents))}
                    </>
                )}
                {noMinute.map((de) => renderDisplayEvent(de, sortedEvents))}
                {displayEvents.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Brak zdarzeń.</Typography>
                )}
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

                        <TextField
                            select
                            label="Typ zdarzenia"
                            value={newEventType}
                            onChange={(e) => onNewEventTypeChange(e.target.value)}
                            required
                        >
                            {EVENT_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        {eventTypeIcon(t)}
                                        <span>{EVENT_TYPE_LABELS[t]}</span>
                                    </Box>
                                </MenuItem>
                            ))}
                        </TextField>

                        {newEventType === "Goal" && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={newEventIsPenalty}
                                        onChange={(e) => onNewEventIsPenaltyChange(e.target.checked)}
                                    />
                                }
                                label="Rzut karny"
                            />
                        )}

                        {newEventTeam === "Us" ? (
                            <TextField
                                select
                                label={newEventType === "Substitution" ? "Schodzi" : "Zawodnik"}
                                value={newEventPlayerId}
                                onChange={(e) => onNewEventPlayerIdChange(Number(e.target.value))}
                                required
                            >
                                {rosterPlayers.map(renderPlayerOption)}
                            </TextField>
                        ) : (
                            <TextField
                                label={newEventType === "Substitution" ? "Schodzi (rywal, opcjonalnie)" : "Nazwisko zawodnika rywala (opcjonalnie)"}
                                value={newEventOpponentName}
                                onChange={(e) => onNewEventOpponentNameChange(e.target.value)}
                            />
                        )}

                        {newEventType === "Substitution" && (
                            newEventTeam === "Us" ? (
                                <TextField
                                    select
                                    label="Wchodzi"
                                    value={newEventSecondPlayerId}
                                    onChange={(e) => onNewEventSecondPlayerIdChange(Number(e.target.value))}
                                    required
                                >
                                    {rosterPlayers.map(renderPlayerOption)}
                                </TextField>
                            ) : (
                                <TextField
                                    label="Wchodzi (rywal, opcjonalnie)"
                                    value={newEventSecondOpponentName}
                                    onChange={(e) => onNewEventSecondOpponentNameChange(e.target.value)}
                                />
                            )
                        )}

                        {newEventType === "Goal" && (
                            newEventTeam === "Us" ? (
                                <TextField
                                    select
                                    label="Asysta (opcjonalnie)"
                                    value={newEventAssistPlayerId}
                                    onChange={(e) => onNewEventAssistPlayerIdChange(e.target.value === "" ? "" : Number(e.target.value))}
                                >
                                    <MenuItem value="">--</MenuItem>
                                    {rosterPlayers.map(renderPlayerOption)}
                                </TextField>
                            ) : (
                                <TextField
                                    label="Asysta (rywal, opcjonalnie)"
                                    value={newEventAssistOpponentName}
                                    onChange={(e) => onNewEventAssistOpponentNameChange(e.target.value)}
                                />
                            )
                        )}

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