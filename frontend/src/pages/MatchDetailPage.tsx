import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, CircularProgress } from "@mui/material";
import { getMatch } from "../api/matchesApi";
import { getPlayers } from "../api/playersApi";
import { getMatchAppearances, createMatchAppearance, deleteMatchAppearance } from "../api/matchAppearancesApi";
import type { Match } from "../types/match";
import type { Player } from "../types/player";
import type { MatchAppearance } from "../types/matchAppearance";
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
    }, [id]);

    function loadAppearances(matchId: number) {
        getMatchAppearances(matchId)
            .then(setAppearances)
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

    if (loading) return <CircularProgress />;
    if (error || !match) return <Alert severity="error">{error ?? "Nie znaleziono meczu."}</Alert>;

    const rosterPlayerIds = new Set(appearances.map((a) => a.playerId));
    const availablePlayers = players.filter((p) => !rosterPlayerIds.has(p.id));

    return (
        <MatchDetailPageView
            match={match}
            players={players}
            appearances={appearances}
            availablePlayers={availablePlayers}
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
        />
    );
}