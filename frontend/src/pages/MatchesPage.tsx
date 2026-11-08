import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePersistentState } from "../hooks/usePersistentState";
import { Alert, CircularProgress } from "@mui/material";
import axios from "axios";
import { getMatches, createMatch, updateMatch, deleteMatch } from "../api/matchesApi";
import { getTeams } from "../api/teamsApi";
import type { Match } from "../types/match";
import { useAuth } from "../context/AuthContext";
import { uploadFile } from "../api/filesApi";
import { groupCompetitions } from "../constants/competitions";
import { MatchesPageView } from "./MatchesPageView";

function toNullableNumber(value: string): number | null {
    return value == "" ? null : Number(value);
}

function toNullableBool(value: string): boolean | null {
    return value == "" ? null : value === "true";
}

export function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [teamCountryCode, setTeamCountryCode] = useState<string | null>(null);
    const [teamLeague, setTeamLeague] = useState<string | null>(null);
    const [tab, setTab] = usePersistentState<Match["status"]>("matches.tab", "Played");
    const [selectedSeason, setSelectedSeason] = usePersistentState("matches.season", "");
    const [date, setDate] = useState("");
    const [opponent, setOpponent] = useState("");
    const [season, setSeason] = useState("");
    const [scoreFor, setScoreFor] = useState("");
    const [scoreAgainst, setScoreAgainst] = useState("");
    const [isHome, setIsHome] = useState("");
    const [matchType, setMatchType] = useState("");
    const [competition, setCompetition] = useState("");
    const [round, setRound] = useState("");
    const [opponentLogoUrl, setOpponentLogoUrl] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editDate, setEditDate] = useState("");
    const [editOpponent, setEditOpponent] = useState("");
    const [editSeason, setEditSeason] = useState("");
    const [editScoreFor, setEditScoreFor] = useState("");
    const [editScoreAgainst, setEditScoreAgainst] = useState("");
    const [editIsHome, setEditIsHome] = useState("");
    const [editMatchType, setEditMatchType] = useState("");
    const [editCompetition, setEditCompetition] = useState("");
    const [editRound, setEditRound] = useState("");
    const [editOpponentLogoUrl, setEditOpponentLogoUrl] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [finishTargetId, setFinishTargetId] = useState<number | null>(null);
    const [finishScoreFor, setFinishScoreFor] = useState("");
    const [finishScoreAgainst, setFinishScoreAgainst] = useState("");
    const [finishError, setFinishError]= useState<string | null>(null);

    function loadMatches() {
        getMatches()
            .then(setMatches)
            .catch(() => setError("Nie udało się pobrać meczów."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadMatches();
        getTeams()
            .then((teams) => {
                setTeamCountryCode(teams[0]?.countryCode ?? null);
                setTeamLeague(teams[0]?.league ?? null);
            })
            .catch(() => {});
    }, []);

    async function handleOpponentLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setOpponentLogoUrl(url);
        } catch {
            setFormError("Nie udało się przesłać pliku.");
        }
    }

    async function handleEditOpponentLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditOpponentLogoUrl(url);
        } catch {
            setActionError("Nie udało się przesłać pliku.");
        }
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createMatch({
                status: tab,
                date,
                opponent,
                season,
                teamId: teamId as number,
                scoreFor: tab === "Played" ? toNullableNumber(scoreFor) : null,
                scoreAgainst: tab === "Played" ? toNullableNumber(scoreAgainst) : null,
                isHome: toNullableBool(isHome),
                matchType: matchType || null,
                competition: matchType === "Cup" ? (competition || null) : null,
                round: round || null,
                formation: null,
                opponentLogoUrl: opponentLogoUrl || null,
            });
            setSelectedSeason(season);
            setDate("");
            setOpponent("");
            setSeason("");
            setScoreFor("");
            setScoreAgainst("");
            setIsHome("");
            setMatchType("");
            setCompetition("");
            setRound("");
            setOpponentLogoUrl("");
            setCreateOpen(false);
            loadMatches();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć meczu.");
            }
        }
    }

    function startEdit(match: Match) {
        setEditingId(match.id);
        setEditDate(match.date);
        setEditOpponent(match.opponent);
        setEditSeason(match.season);
        setEditScoreFor(match.scoreFor?.toString() ?? "");
        setEditScoreAgainst(match.scoreAgainst?.toString() ?? "");
        setEditIsHome(match.isHome?.toString() ?? "");
        setEditMatchType(match.matchType ?? "");
        setEditCompetition(match.competition ?? "");
        setEditRound(match.round ?? "");
        setEditOpponentLogoUrl(match.opponentLogoUrl ?? "");
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            const editingMatch = matches.find((m) => m.id === id);
            await updateMatch(id, {
                status: editingMatch?.status ?? "Played",
                date: editDate,
                opponent: editOpponent,
                season: editSeason,
                teamId: teamId as number,
                scoreFor: toNullableNumber(editScoreFor),
                scoreAgainst: toNullableNumber(editScoreAgainst),
                isHome: toNullableBool(editIsHome),
                matchType: editMatchType || null,
                competition: editMatchType === "Cup" ? (editCompetition || null) : null,
                round: editRound || null,
                formation: editingMatch?.formation ?? null,
                opponentLogoUrl: editOpponentLogoUrl || null,
            });
            setEditingId(null);
            loadMatches();
        } catch {
            setActionError("Nie udało się zaktualizować meczu.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deleteMatch(id);
            loadMatches();
        } catch {
            setActionError("Nie udało się usunąć meczu.");
        }
    }

    function requestDelete(id: number) {
        setDeleteTargetId(id);
    }

    function cancelDelete() {
        setDeleteTargetId(null);
    }

    async function confirmDelete() {
        if (deleteTargetId === null) return;
        await handleDelete(deleteTargetId);
        setDeleteTargetId(null);
    }

    function requestFinish(id: number) {
        setFinishTargetId(id);
        setFinishScoreFor("");
        setFinishScoreAgainst("");
        setFinishError(null);
    }

    function cancelFinish() {
        setFinishTargetId(null);
    }

    async function confirmFinish() {
        const match = matches.find((m) => m.id === finishTargetId);
        if (!match) return;

        const goalsFor = toNullableNumber(finishScoreFor);
        const goalsAgainst = toNullableNumber(finishScoreAgainst);
        if (goalsFor === null || goalsAgainst === null || goalsFor < 0 || goalsAgainst < 0) {
            setFinishError("Podaj wynik meczu.");
            return;
        }

        try {
            await updateMatch(match.id, {
                ...match,
                status: "Played",
                scoreFor: goalsFor,
                scoreAgainst: goalsAgainst,
            });
            setFinishTargetId(null);
            navigate(`/matches/${match.id}`);
        } catch {
            setFinishError("Nie udało się zakończyć meczu.");
        }
    }

    const playedCount = matches.filter((m) => m.status === "Played").length;
    const plannedCount = matches.filter((m) => m.status === "Planned").length;
    const visibleMatches = matches.filter((m) => m.status === tab);
    const finishMatch = matches.find((m) => m.id === finishTargetId) ?? null;
    const editScoreEnabled = matches.find((m) => m.id === editingId)?.status === "Played";
    
    const seasons = [...new Set(visibleMatches.map((m) => m.season))].sort().reverse();
    const seasonFilter = seasons.includes(selectedSeason) ? selectedSeason : (seasons[0] ?? "");
    const seasonMatches = visibleMatches
        .filter((m) => m.season === seasonFilter)
        .sort((a, b) => (tab === "Planned" ? 1 : -1) * a.date.localeCompare(b.date));

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    const competitionGroups = groupCompetitions(teamCountryCode);

    return (
        <MatchesPageView
            matches={seasonMatches}
            seasons={seasons}
            seasonFilter={seasonFilter}
            onSeasonFilterChange={setSelectedSeason}
            canCreate={!!canCreate}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            competitionGroups={competitionGroups}
            teamLeague={teamLeague}
            tab={tab}
            playedCount={playedCount}
            plannedCount={plannedCount}
            date={date}
            opponent={opponent}
            season={season}
            scoreFor={scoreFor}
            scoreAgainst={scoreAgainst}
            isHome={isHome}
            matchType={matchType}
            competition={competition}
            round={round}
            opponentLogoUrl={opponentLogoUrl}
            formError={formError}
            onTabChange={setTab}
            onDateChange={setDate}
            onOpponentChange={setOpponent}
            onSeasonChange={setSeason}
            onScoreForChange={setScoreFor}
            onScoreAgainstChange={setScoreAgainst}
            onIsHomeChange={setIsHome}
            onMatchTypeChange={setMatchType}
            onCompetitionChange={setCompetition}
            onRoundChange={setRound}
            onOpponentLogoSelect={handleOpponentLogoSelect}
            createOpen={createOpen}
            onOpenCreate={() => setCreateOpen(true)}
            onCloseCreate={() => setCreateOpen(false)}
            onCreate={handleCreate}
            editingId={editingId}
            editDate={editDate}
            editOpponent={editOpponent}
            editSeason={editSeason}
            editScoreFor={editScoreFor}
            editScoreAgainst={editScoreAgainst}
            editIsHome={editIsHome}
            editMatchType={editMatchType}
            editCompetition={editCompetition}
            editRound={editRound}
            editOpponentLogoUrl={editOpponentLogoUrl}
            actionError={actionError}
            onStartEdit={startEdit}
            onEditDateChange={setEditDate}
            onEditOpponentChange={setEditOpponent}
            onEditSeasonChange={setEditSeason}
            onEditScoreForChange={setEditScoreFor}
            onEditScoreAgainstChange={setEditScoreAgainst}
            onEditIsHomeChange={setEditIsHome}
            onEditMatchTypeChange={setEditMatchType}
            onEditCompetitionChange={setEditCompetition}
            onEditRoundChange={setEditRound}
            onEditOpponentLogoSelect={handleEditOpponentLogoSelect}
            editScoreEnabled={editScoreEnabled}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            deleteDialogOpen={deleteTargetId !== null}
            onRequestDelete={requestDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            finishMatch={finishMatch}
            finishScoreFor={finishScoreFor}
            finishScoreAgainst={finishScoreAgainst}
            finishError={finishError}
            onFinishScoreForChange={setFinishScoreFor}
            onFinishScoreAgainstChange={setFinishScoreAgainst}
            onRequestFinish={requestFinish}
            onCancelFinish={cancelFinish}
            onConfirmFinish={confirmFinish}
        />
    );
}