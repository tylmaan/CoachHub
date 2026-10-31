import { useEffect, useState } from "react";
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

    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");

    function loadMatches() {
        setLoading(true);
        getMatches()
            .then(setMatches)
            .catch(() => setError("Nie udało się pobrać meczów."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadMatches();
        getTeams()
            .then((teams) => setTeamCountryCode(teams[0]?.countryCode ?? null))
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
                date,
                opponent,
                season,
                teamId: teamId as number,
                scoreFor: toNullableNumber(scoreFor),
                scoreAgainst: toNullableNumber(scoreAgainst),
                isHome: toNullableBool(isHome),
                matchType: matchType || null,
                competition: matchType === "Cup" ? (competition || null) : null,
                round: round || null,
                formation: null,
                opponentLogoUrl: opponentLogoUrl || null,
            });
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

    const matchesBySeason = [...matches]
        .sort((a ,b) => b.season.localeCompare(a.season) || b.date.localeCompare(a.date))
        .reduce<{ season: string; matches: Match[] }[]>((groups, match) => {
            const group = groups.find(g => g.season === match.season);
            if (group) {
                group.matches.push(match);
            } else {
                groups.push({ season: match.season, matches: [match] });
            }
            return groups;
        }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    const competitionGroups = groupCompetitions(teamCountryCode);

    return (
        <MatchesPageView
            matchesBySeason={matchesBySeason}
            canCreate={!!canCreate}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            competitionGroups={competitionGroups}
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
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onDelete={handleDelete}
        />
    );
}