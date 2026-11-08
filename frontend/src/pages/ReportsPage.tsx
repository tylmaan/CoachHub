import { useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { Alert, CircularProgress } from '@mui/material';
import axios from 'axios';
import { getReports, createReport, updateReport, deleteReport } from '../api/reportsApi';
import { getPlayers } from '../api/playersApi';
import { getMatches } from '../api/matchesApi';
import { useAuth } from '../context/AuthContext';
import type { Report, ReportKind } from '../types/report';
import { reportKind } from '../types/report';
import type { Player } from '../types/player';
import type { Match } from '../types/match';
import { ReportsPageView } from './ReportsPageView';

export function ReportsPage() {
    const { roles, teamId } = useAuth();
    const canDelete = !!roles?.includes('Coach');

    const [reports, setReports] = useState<Report[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const [search, setSearch] = usePersistentState("reports.search", "");
    const [kindFilter, setKindFilter] = usePersistentState<ReportKind | "">("reports.kind", "");
    const [authorFilter, setAuthorFilter] = usePersistentState("reports.author", "");

    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [targetType, setTargetType] = useState<"team" | "player">("team");
    const [playerId, setPlayerId] = useState<number | "">("");
    const [matchId, setMatchId] = useState<number | "">("");
    const [formError, setFormError] = useState<string | null>(null);

    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    function loadReports() {
        getReports()
            .then(setReports)
            .catch(() => setError("Nie udało się pobrać raportów."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadReports();
        getPlayers()
            .then(setPlayers)
            .catch(() => {});
        getMatches()
            .then(setMatches)
            .catch(() => {});
    }, []);

    function resetForm() {
        setEditingId(null);
        setTitle("");
        setContent("");
        setTargetType("team");
        setPlayerId("");
        setMatchId("");
        setFormError(null);
    }

    function openCreate() {
        resetForm();
        setFormOpen(true);
    }

    function openEdit(report: Report) {
        setEditingId(report.id);
        setTitle(report.title);
        setContent(report.content);
        setTargetType(report.playerId != null ? "player" : "team");
        setPlayerId(report.playerId ?? "");
        setMatchId(report.matchId ?? "");
        setFormError(null);
        setFormOpen(true);
    }

    function closeForm() {
        setFormOpen(false);
    }

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);

        if (targetType === "player" && playerId === "") {
            setFormError("Wybierz zawodnika.");
            return;
        }

        const request = {
            title,
            content,
            playerId: targetType === "player" ? (playerId as number) : null,
            teamId: targetType === "team" ? teamId : null,
            matchId: matchId === "" ? null : matchId,
        };

        try {
            if (editingId === null) {
                await createReport(request);
            } else {
                await updateReport(editingId, request);
            }
            setFormOpen(false);
            loadReports();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się zapisać raportu.");
            }
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
        setActionError(null);
        try {
            await deleteReport(deleteTargetId);
            loadReports();
        } catch {
            setActionError("Nie udało się usunąć raportu.");
        }
        setDeleteTargetId(null);
    }

    const authors = [...new Map(reports.map((r) => [r.authorId, r.authorName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const playerOptions = [...players]
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((p) => ({ id: p.id, label: `${p.firstName} ${p.lastName}`.trim() }));
    
    const matchOptions = [...matches]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((m) => ({ id: m.id, label: `${m.date} · ${m.opponent}` }));

    const searchTerm = search.trim().toLowerCase();
    const filteredReports = reports.filter((r) =>
        (kindFilter === "" || reportKind(r) === kindFilter) &&
        (authorFilter === "" || r.authorId === authorFilter) &&
        (searchTerm === "" || `${r.title} ${r.content}`.toLowerCase().includes(searchTerm))
    );

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <ReportsPageView
            reports={filteredReports}
            totalCount={reports.length}
            authors={authors}
            search={search}
            onSearchChange={setSearch}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            authorFilter={authorFilter}
            onAuthorFilterChange={setAuthorFilter}
            canDelete={canDelete}
            actionError={actionError}
            formOpen={formOpen}
            isEditing={editingId !== null}
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            targetType={targetType}
            onTargetTypeChange={setTargetType}
            playerId={playerId}
            onPlayerIdChange={setPlayerId}
            matchId={matchId}
            onMatchIdChange={setMatchId}
            playerOptions={playerOptions}
            matchOptions={matchOptions}
            formError={formError}
            onOpenCreate={openCreate}
            onOpenEdit={openEdit}
            onCloseForm={closeForm}
            onSubmit={handleSubmit}
            deleteDialogOpen={deleteTargetId !== null}
            onRequestDelete={requestDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
        />
    );
}