import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, CircularProgress } from "@mui/material";
import { getMatch, updateMatch } from "../api/matchesApi";
import { getPlayers } from "../api/playersApi";
import { getMatchAppearances, createMatchAppearance, deleteMatchAppearance, updateMatchAppearance } from "../api/matchAppearancesApi";
import { getMatchEvents, createMatchEvent, deleteMatchEvent } from "../api/matchEventsApi";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
import type { MatchEvent } from "../types/matchEvent";
import type { DragSource, DropTarget } from "../types/lineupDrag";
import type { PickerOption } from "../types/pickerOption";
import { MatchDetailPageView } from "./MatchDetailPageView";
import { POSITION_GROUPS } from "../constants/labels";

const STOPPAGE_MINUTES = [45, 90, 105, 120];

export function MatchDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { roles } = useAuth();
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [players, setPlayers] = useState<Player[]>([]);
    const [appearances, setAppearances] = useState<MatchAppearance[]>([]);
    const [formation, setFormation] = useState("433");
    const [rosterError, setRosterError] = useState<string | null>(null);

    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerIsStarting, setPickerIsStarting] = useState(true);
    const [pickerPosition, setPickerPosition] = useState<string | null>(null);
    const [pickerAppearanceId, setPickerAppearanceId] = useState<number | null>(null);
    const [pickerSlotKey, setPickerSlotKey] = useState<string | null>(null);
    const [pickerTab, setPickerTab] = useState(0);
    const [pickerSearch, setPickerSearch] = useState("");

    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [eventOpen, setEventOpen] = useState(false);
    const [newEventTeam, setNewEventTeam] = useState("Us");
    const [newEventType, setNewEventType] = useState("");
    const [newEventMinute, setNewEventMinute] = useState("");
    const [newEventAddedTime, setNewEventAddedTime] = useState("");
    const [newEventPlayerId, setNewEventPlayerId] = useState<number | "">("");
    const [newEventOpponentName, setNewEventOpponentName] = useState("");
    const [newEventIsPenalty, setNewEventIsPenalty] = useState(false);
    const [newEventAssistPlayerId, setNewEventAssistPlayerId] = useState<number | "">("");
    const [newEventAssistOpponentName, setNewEventAssistOpponentName] = useState("");
    const [newEventSecondPlayerId, setNewEventSecondPlayerId] = useState<number | "">("");
    const [newEventSecondOpponentName, setNewEventSecondOpponentName] = useState("");
    const [eventError, setEventError] = useState<string | null>(null);

    const addedTimeEnabled = newEventMinute !== "" && STOPPAGE_MINUTES.includes(Number(newEventMinute));
    const canDrag = !!roles?.some((r) => r === "Coach" || r === "AssistantCoach");
    const [dragId, setDragId] = useState<number | null>(null);
    const [overKey, setOverKey] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getMatch(Number(id))
            .then((data) => {
                setMatch(data);
                setFormation(data.formation ?? "433");
            })
            .catch(() => setError("Nie udało się pobrać meczu."))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!id) return;
        getPlayers()
            .then(setPlayers)
            .catch(() => {});
        loadAppearances(Number(id));
        loadEvents(Number(id));
    }, [id]);

    function loadAppearances(matchId: number) {
        getMatchAppearances(matchId)
            .then(setAppearances)
            .catch(() => {});
    }

    function loadEvents(matchId: number) {
        getMatchEvents(matchId)
            .then(setEvents)
            .catch(() => {});
    }

    async function handleFormationChange(value: string) {
        if (!match || !id) return;
        setFormation(value);
        const { id: matchId, ...rest } = match;
        try {
            await updateMatch(matchId, { ...rest, formation: value });
            setMatch({ ...match, formation: value });
            const startingIds = appearances.filter((a) => a.isStarting).map((a) => a.id);
            await Promise.all(startingIds.map((appearanceId) => deleteMatchAppearance(appearanceId)));
            loadAppearances(Number(id));
        } catch {
            setRosterError("Nie udało się zapisać formacji.");
        }
    }

    function openPitchPicker(pos: string, slotKey: string, appearance: MatchAppearance | null) {
        setPickerIsStarting(true);
        setPickerPosition(pos);
        setPickerSlotKey(slotKey);
        setPickerAppearanceId(appearance?.id ?? null);
        const idx = POSITION_GROUPS.findIndex((g) => g.codes.includes(pos));
        setPickerTab(idx >= 0 ? idx : 0);
        setPickerSearch("");
        setRosterError(null);
        setPickerOpen(true);
    }

    function openBenchPicker(appearance: MatchAppearance | null) {
        setPickerIsStarting(false);
        setPickerPosition(null);
        setPickerAppearanceId(appearance?.id ?? null);
        setPickerTab(0);
        setPickerSearch("");
        setRosterError(null);
        setPickerOpen(true);
    }

    function closePicker() {
        setPickerSearch("");
        setPickerOpen(false);
    }

    async function handlePickPlayer(playerId: number) {
        if (!id) return;
        setRosterError(null);
        try {
            if (pickerAppearanceId) {
                await deleteMatchAppearance(pickerAppearanceId);
            }
            await createMatchAppearance({
                matchId: Number(id),
                playerId,
                isStarting: pickerIsStarting,
                position: pickerIsStarting ? pickerSlotKey : null,
            });
            closePicker();
            loadAppearances(Number(id));
        } catch {
            setRosterError("Nie udało się dodać zawodnika do składu.");
        }
    }

    async function handleRemoveFromPicker() {
        if (!id || !pickerAppearanceId) return;
        try {
            await deleteMatchAppearance(pickerAppearanceId);
            closePicker();
            loadAppearances(Number(id));
        } catch {
            setRosterError("Nie udało się usunąć zawodnika ze składu.");
        }
    }

    async function handleMoveAppearance(source: DragSource, target: DropTarget) {
        if (!id) return;
        const matchId = Number(id);
        const moved = appearances.find((a) => a.id === source.appearanceId);
        if (!moved) return;
        setRosterError(null);

        try {
            if (target.kind === "bench") {
                if (!moved.isStarting) return;
                await updateMatchAppearance(moved.id, { 
                    matchId,
                    playerId: moved.playerId,
                    isStarting: false,
                    position: null
                });
            } else {
                if (moved.isStarting && moved.position === target.slotKey) return;
                const occupant = appearances.find((a) => a.isStarting && a.position === target.slotKey && a.id !== moved.id);

                await updateMatchAppearance(moved.id, {
                    matchId,
                    playerId: moved.playerId,
                    isStarting: true,
                    position: target.slotKey
                });

                if (occupant) {
                    await updateMatchAppearance(occupant.id, {
                        matchId,
                        playerId: occupant.playerId,
                        isStarting: moved.isStarting,
                        position: moved.isStarting ? moved.position : null
                    });
                }
            }
            loadAppearances(matchId);
        } catch {
            setRosterError("Nie udało się przenieść zawodnika.");
            loadAppearances(matchId);
        }
    }

    function handleDragStart(appearanceId: number) {
        setDragId(appearanceId);
    }

    function handleDragEnd() {
        setDragId(null);
        setOverKey(null);
    }

    function handleDragOverTarget(key: string) {
        setOverKey(key);
    }

    function handleDragLeaveTarget(key: string) {
        setOverKey((current) => (current === key ? null : current));
    }

    function handleDropOn(target: DropTarget) {
        if (dragId !== null) {
            handleMoveAppearance({ appearanceId: dragId }, target);
        }
        setDragId(null);
        setOverKey(null);
    }

    function handleMinuteChange(value: string) {
        setNewEventMinute(value);
        if (!STOPPAGE_MINUTES.includes(Number(value))) {
            setNewEventAddedTime("");
        }
    }

    function openEventDialog() {
        setEventOpen(true);
        setNewEventTeam("Us");
        setNewEventType("");
        setNewEventMinute("");
        setNewEventAddedTime("");
        setNewEventPlayerId("");
        setNewEventOpponentName("");
        setNewEventIsPenalty(false);
        setNewEventAssistPlayerId("");
        setNewEventAssistOpponentName("");
        setNewEventSecondPlayerId("");
        setNewEventSecondOpponentName("");
        setEventError(null);
    }

    function closeEventDialog() {
        setEventOpen(false);
    }

    async function handleAddEvent(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!id) return;
        setEventError(null);
        const matchId = Number(id);
        const minute = newEventMinute === "" ? null : Number(newEventMinute);
        const addedTime = newEventAddedTime === "" ? null : Number(newEventAddedTime);
        if (addedTime !== null && (minute === null || !STOPPAGE_MINUTES.includes(minute))) {
            setEventError("Dodanie czasu doliczonego jest możliwe tylko dla minut 45, 90, 105 lub 120.");
            return;
        }
        try {
            if (newEventType === "Substitution") {
                await createMatchEvent({
                    matchId,
                    eventType: "SubstitutionOff",
                    team: newEventTeam,
                    minute,
                    addedTime,
                    playerId: newEventTeam === "Us" ? (newEventPlayerId as number) : null,
                    opponentPlayerName: newEventTeam === "Opponent" ? (newEventOpponentName || null) : null,
                });
                await createMatchEvent({
                    matchId,
                    eventType: "SubstitutionIn",
                    team: newEventTeam,
                    minute,
                    addedTime,
                    playerId: newEventTeam === "Us" ? (newEventSecondPlayerId as number) : null,
                    opponentPlayerName: newEventTeam === "Opponent" ? (newEventSecondOpponentName || null) : null,
                });
            } else {
                const actualType = newEventType === "Goal" && newEventIsPenalty ? "PenaltyGoal" : newEventType;
                await createMatchEvent({
                    matchId,
                    eventType: actualType,
                    team: newEventTeam,
                    minute,
                    addedTime,
                    playerId: newEventTeam === "Us" ? (newEventPlayerId as number) : null,
                    opponentPlayerName: newEventTeam === "Opponent" ? (newEventOpponentName || null) : null
                });
                const hasAssist = newEventTeam === "Us" ? newEventAssistPlayerId !== "" : newEventAssistOpponentName.trim() !== "";
                if (newEventType === "Goal" && hasAssist) {
                    await createMatchEvent({
                        matchId,
                        eventType: "Assist",
                        team: newEventTeam,
                        minute,
                        addedTime,
                        playerId: newEventTeam === "Us" ? (newEventAssistPlayerId as number) : null,
                        opponentPlayerName: newEventTeam === "Opponent" ? (newEventAssistOpponentName || null) : null
                    });
                }
            }
            closeEventDialog();
            loadEvents(matchId);
        } catch {
            setEventError("Nie udało się dodać zdarzenia.");
        }
    }

    async function handleRemoveEvent(eventId: number) {
        if (!id) return;
        try {
            await deleteMatchEvent(eventId);
            loadEvents(Number(id));
        } catch {
            setEventError("Nie udało się usunąć zdarzenia.");
        }
    }

    if (loading) return <CircularProgress />;
    if (error || !match) return <Alert severity="error">{error ?? "Nie znaleziono meczu."}</Alert>;

    const rosterPlayerIds = new Set(appearances.map((a) => a.playerId));
    const rosterPlayers = players.filter((p) => rosterPlayerIds.has(p.id));
    const searchTerm = pickerSearch.trim().toLowerCase();
    const pickerOptions: PickerOption[] = players
        .filter((p) => searchTerm !== "" || POSITION_GROUPS[pickerTab].codes.includes(p.position))
        .filter((p) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm))
        .map((p) => ({
            player: p,
            inLineup: rosterPlayerIds.has(p.id),
            fitsPosition: pickerIsStarting && p.position === pickerPosition,
        }))
        .sort(
            (a, b) => 
                Number(b.fitsPosition) - Number(a.fitsPosition) || 
                Number(a.inLineup) - Number(b.inLineup) ||
                (a.player.jerseyNumber ?? 999) - (b.player.jerseyNumber ?? 999)
            );

    return (
        <MatchDetailPageView
            match={match}
            players={players}
            appearances={appearances}
            rosterPlayers={rosterPlayers}
            rosterError={rosterError}
            formation={formation}
            onFormationChange={handleFormationChange}
            pickerOpen={pickerOpen}
            pickerIsStarting={pickerIsStarting}
            pickerPosition={pickerPosition}
            pickerTab={pickerTab}
            onPickerTabChange={setPickerTab}
            pickerSearch={pickerSearch}
            onPickerSearchChange={setPickerSearch}
            pickerOptions={pickerOptions}
            pickerHasAppearance={pickerAppearanceId !== null}
            onOpenPitchPicker={openPitchPicker}
            onOpenBenchPicker={openBenchPicker}
            onClosePicker={closePicker}
            onPickPlayer={handlePickPlayer}
            onRemoveFromPicker={handleRemoveFromPicker}
            events={events}
            eventOpen={eventOpen}
            newEventTeam={newEventTeam}
            newEventType={newEventType}
            newEventMinute={newEventMinute}
            newEventAddedTime={newEventAddedTime}
            newEventPlayerId={newEventPlayerId}
            newEventOpponentName={newEventOpponentName}
            newEventIsPenalty={newEventIsPenalty}
            newEventAssistPlayerId={newEventAssistPlayerId}
            newEventAssistOpponentName={newEventAssistOpponentName}
            newEventSecondPlayerId={newEventSecondPlayerId}
            newEventSecondOpponentName={newEventSecondOpponentName}
            onNewEventSecondPlayerIdChange={setNewEventSecondPlayerId}
            onNewEventSecondOpponentNameChange={setNewEventSecondOpponentName}
            onNewEventIsPenaltyChange={setNewEventIsPenalty}
            onNewEventAssistPlayerIdChange={setNewEventAssistPlayerId}
            onNewEventAssistOpponentNameChange={setNewEventAssistOpponentName}
            eventError={eventError}
            onOpenEvent={openEventDialog}
            onCloseEvent={closeEventDialog}
            onNewEventTeamChange={setNewEventTeam}
            onNewEventTypeChange={setNewEventType}
            onNewEventMinuteChange={handleMinuteChange}
            onNewEventAddedTimeChange={setNewEventAddedTime}
            onNewEventPlayerIdChange={setNewEventPlayerId}
            onNewEventOpponentNameChange={setNewEventOpponentName}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
            addedTimeEnabled={addedTimeEnabled}
            canDrag={canDrag}
            dragId={dragId}
            overKey={overKey}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOverTarget={handleDragOverTarget}
            onDragLeaveTarget={handleDragLeaveTarget}
            onDropOn={handleDropOn}
        />
    );
}