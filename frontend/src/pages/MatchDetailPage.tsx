import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, CircularProgress } from "@mui/material";
import { getMatch } from "../api/matchesApi";
import { getPlayers } from "../api/playersApi";
import { getMatchAppearances, createMatchAppearance, deleteMatchAppearance } from "../api/matchAppearancesApi";
import { getMatchEvents, createMatchEvent, deleteMatchEvent } from "../api/matchEventsApi";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
import type { MatchEvent } from "../types/matchEvent";
import { MatchDetailPageView } from "./MatchDetailPageView";

export function MatchDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [players, setPlayers] = useState<Player[]>([]);
    const [appearances, setAppearances] = useState<MatchAppearance[]>([]);
    const [rosterOpen, setRosterOpen] = useState(false);
    const [newPlayerId, setNewPlayerId] = useState<number | "">("");
    const [newIsStarting, setNewIsStarting] = useState(true);
    const [rosterError, setRosterError] = useState<string | null>(null);

    const [events, setEvents] = useState<MatchEvent[]>([]);
    const [eventOpen, setEventOpen] = useState(false);
    const [newEventTeam, setNewEventTeam] = useState("Us");
    const [newEventType, setNewEventType] = useState("");
    const [newEventMinute, setNewEventMinute] = useState("");
    const [newEventPlayerId, setNewEventPlayerId] = useState<number | "">("");
    const [newEventOpponentName, setNewEventOpponentName] = useState("");
    const [eventError, setEventError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getMatch(Number(id))
            .then(setMatch)
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

    function openRosterDialog() {
        setRosterOpen(true);
        setNewPlayerId("");
        setNewIsStarting(true);
        setRosterError(null);
    }

    function closeRosterDialog() {
        setRosterOpen(false);
    }

    async function handleAddAppearance(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!id || newPlayerId === "") return;
        setRosterError(null);
        try {
            await createMatchAppearance({
                matchId: Number(id),
                playerId: newPlayerId as number,
                isStarting: newIsStarting
            });
            closeRosterDialog();
            loadAppearances(Number(id));
        } catch {
            setRosterError("Nie udało się dodać zawodnika do składu.");
        }
    }

    async function handleRemoveAppearance(appearanceId: number) {
        if (!id) return;
        try {
            await deleteMatchAppearance(appearanceId);
            loadAppearances(Number(id));
        } catch {
            setRosterError("Nie udało się usunąć zawodnika ze składu.");
        }
    }

    function openEventDialog() {
        setEventOpen(true);
        setNewEventTeam("Us");
        setNewEventType("");
        setNewEventMinute("");
        setNewEventPlayerId("");
        setNewEventOpponentName("");
        setEventError(null);
    }

    function closeEventDialog() {
        setEventOpen(false);
    }

    async function handleAddEvent(e: React.SyntheticEvent) {
        e.preventDefault();
        if (!id) return;
        setEventError(null);
        try {
            await createMatchEvent({
                matchId: Number(id),
                eventType: newEventType,
                team: newEventTeam,
                minute: newEventMinute === "" ? null : Number(newEventMinute),
                playerId: newEventTeam === "Us" ? (newEventPlayerId as number) : null,
                opponentPlayerName: newEventTeam === "Opponent" ? (newEventOpponentName || null) : null,
            });
            closeEventDialog();
            loadEvents(Number(id));
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
    const availablePlayers = players.filter((p) => !rosterPlayerIds.has(p.id));
    const rosterPlayers = players.filter((p) => rosterPlayerIds.has(p.id));

    return (
        <MatchDetailPageView
            match={match}
            players={players}
            appearances={appearances}
            availablePlayers={availablePlayers}
            rosterPlayers={rosterPlayers}
            rosterOpen={rosterOpen}
            newPlayerId={newPlayerId}
            newIsStarting={newIsStarting}
            rosterError={rosterError}
            onOpenRoster={openRosterDialog}
            onCloseRoster={closeRosterDialog}
            onNewPlayerIdChange={setNewPlayerId}
            onNewIsStartingChange={setNewIsStarting}
            onAddAppearance={handleAddAppearance}
            onRemoveAppearance={handleRemoveAppearance}
            events={events}
            eventOpen={eventOpen}
            newEventTeam={newEventTeam}
            newEventType={newEventType}
            newEventMinute={newEventMinute}
            newEventPlayerId={newEventPlayerId}
            newEventOpponentName={newEventOpponentName}
            eventError={eventError}
            onOpenEvent={openEventDialog}
            onCloseEvent={closeEventDialog}
            onNewEventTeamChange={setNewEventTeam}
            onNewEventTypeChange={setNewEventType}
            onNewEventMinuteChange={setNewEventMinute}
            onNewEventPlayerIdChange={setNewEventPlayerId}
            onNewEventOpponentNameChange={setNewEventOpponentName}
            onAddEvent={handleAddEvent}
            onRemoveEvent={handleRemoveEvent}
        />
    );
}