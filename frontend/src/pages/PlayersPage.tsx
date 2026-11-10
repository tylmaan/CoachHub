import { useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { Alert, CircularProgress } from '@mui/material';
import axios from "axios";
import { getPlayers, createPlayer, updatePlayer, deletePlayer, archivePlayer, restorePlayer, getPlayerDeletionImpact } from '../api/playersApi';
import type { Player } from '../types/player';
import { useAuth } from "../context/AuthContext";
import { uploadFile } from '../api/filesApi';
import { PlayersPageView } from './PlayersPageView';
import {POSITIONS} from "../constants/labels";

type SortField = "lastName" | "position" | "jerseyNumber" | "age";

function toNullableNumber(value: string): number | null {
    return value === "" ? null : Number(value);
}

function normalize(value: string): string {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = usePersistentState<SortField>("players.sortField", "lastName");
    const [sortAsc, setSortAsc] = usePersistentState("players.sortAsc", true);
    const [search, setSearch] = usePersistentState("players.search", "");
    const [view, setView] = usePersistentState<"active" | "archived">("players.view", "active");

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [nationality, setNationality] = useState<string | null>(null);
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [position, setPosition] = useState("");
    const [heightCm, setHeightCm] = useState("");
    const [jerseyNumber, setJerseyNumber] = useState("");
    const [preferredFoot, setPreferredFoot] = useState("");
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFirstName, setEditFirstName] = useState("");
    const [editLastName, setEditLastName] = useState("");
    const [editNationality, setEditNationality] = useState<string | null>(null);
    const [editDateOfBirth, setEditDateOfBirth] = useState("");
    const [editPosition, setEditPosition] = useState("");
    const [editHeightCm, setEditHeightCm] =useState("");
    const [editJerseyNumber, setEditJerseyNumber] = useState("");
    const [editPreferredFoot, setEditPreferredFoot] =useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
    const [deleteReports, setDeleteReports] = useState(0);

    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");

    function loadPlayers() {
        getPlayers()
            .then(setPlayers)
            .catch(() => setError("Nie udało się pobrać zawodników."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadPlayers();
    }, []);

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    }

    async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setPhotoUrl(url);
        } catch {
            setFormError("Nie udało się wgrać zdjęcia.");
        }
    }

    async function handleEditPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditPhotoUrl(url);
        } catch {
            setActionError("Nie udało się wgrać zdjęcia.");
        }
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createPlayer({
                firstName,
                lastName,
                nationality,
                dateOfBirth,
                position,
                teamId: teamId as number,
                heightCm : toNullableNumber(heightCm),
                jerseyNumber: toNullableNumber(jerseyNumber),
                preferredFoot: preferredFoot || null,
                photoUrl
            });
            setFirstName("");
            setLastName("");
            setNationality(null);
            setDateOfBirth("");
            setPosition("");
            setHeightCm("");
            setJerseyNumber("");
            setPreferredFoot("");
            setPhotoUrl(null);
            setCreateOpen(false);
            loadPlayers();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się dodać zawodnika.")
            }
        }
    }

    function startEdit(player: Player) {
        setEditingId(player.id);
        setEditFirstName(player.firstName);
        setEditLastName(player.lastName);
        setEditNationality(player.nationality);
        setEditDateOfBirth(player.dateOfBirth);
        setEditPosition(player.position);
        setEditHeightCm(player.heightCm?.toString() ?? "");
        setEditJerseyNumber(player.jerseyNumber?.toString() ?? "");
        setEditPreferredFoot(player.preferredFoot ?? "");
        setEditPhotoUrl(player.photoUrl);
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updatePlayer(id, {
                firstName: editFirstName,
                lastName: editLastName,
                nationality: editNationality,
                dateOfBirth: editDateOfBirth,
                position: editPosition,
                teamId: teamId as number,
                heightCm: toNullableNumber(editHeightCm),
                jerseyNumber: toNullableNumber(editJerseyNumber),
                preferredFoot: editPreferredFoot || null,
                photoUrl: editPhotoUrl
            });
            setEditingId(null);
            loadPlayers();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deletePlayer(id);
            loadPlayers();
        } catch (err){
            setActionError(
                axios.isAxiosError(err) && typeof err.response?.data === "string"
                    ? err.response.data
                    : "Nie udało się usunąć zawodnika."
            );
        }
    }

    async function requestDelete(id: number) {
        setActionError(null)
        try {
            const impact = await getPlayerDeletionImpact(id);
            if (impact.appearances > 0 || impact.events > 0) {
                setActionError(`Zawodnik ma dane meczowe (występy: ${impact.appearances}, zdarzenia: ${impact.events}), więc musi zostać w archiwum.`);
                return;
            }
            setDeleteReports(impact.reports);
            setDeleteTargetId(id);
        } catch {
            setActionError("Nie udało się sprawdzić skutków usunięcia zawodnika.");
        }
    }

    async function handleArchive(id: number) {
        setActionError(null);
        try {
            await archivePlayer(id);
            loadPlayers();
        } catch {
            setActionError("Nie udało się przenieść zawodnika do archiwum.");
        }
    }

    async function handleRestore(id: number) {
        setActionError(null);
        try {
            await restorePlayer(id);
            loadPlayers();
        } catch {
            setActionError("Nie udało się przywrócić zawodnika z archiwum.");
        }
    }

    function cancelDelete() {
        setDeleteTargetId(null);
    }

    async function confirmDelete() {
        if (deleteTargetId === null) return;
        await handleDelete(deleteTargetId);
        setDeleteTargetId(null);
    }

    const activePlayers = players.filter((p) => p.archivedAt === null);
    const archivedPlayers = players.filter((p) => p.archivedAt !== null);
    const viewPlayers = view === "active" ? activePlayers : archivedPlayers;

    const query = normalize(search.trim());
    const filteredPlayers = viewPlayers.filter((p) =>
        normalize(`${p.firstName} ${p.lastName}`).includes(query) 
    );

    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
        let result = 0;
        if (sortField === "lastName") result = a.lastName.localeCompare(b.lastName);
        if (sortField === "position") result = POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position);
        if (sortField === "jerseyNumber") result = (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0);
        if (sortField === "age") result = b.dateOfBirth.localeCompare(a.dateOfBirth); 
        return sortAsc ? result : -result;
    });

    const deleteMessage = deleteReports > 0
        ? `Zawodnik zostanie usunięty bezpowrotnie razem z raportami (${deleteReports}). Czy na pewno chcesz kontynuować?`
        : "Zawodnik zostanie usunięty bezpowrotnie. Czy na pewno chcesz kontynuować?";

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <PlayersPageView
            players={sortedPlayers}
            canCreate={!!canCreate}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            sortField={sortField}
            sortAsc={sortAsc}
            search={search}
            onSearchChange={setSearch}
            onSort={handleSort}
            firstName={firstName}
            lastName={lastName}
            nationality={nationality}
            dateOfBirth={dateOfBirth}
            position={position}
            heightCm={heightCm}
            jerseyNumber={jerseyNumber}
            preferredFoot={preferredFoot}
            photoUrl={photoUrl}
            formError={formError}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
            onNationalityChange={setNationality}
            onDateOfBirthChange={setDateOfBirth}
            onPositionChange={setPosition}
            onHeightCmChange={setHeightCm}
            onJerseyNumberChange={setJerseyNumber}
            onPreferredFootChange={setPreferredFoot}
            onPhotoSelect={handlePhotoSelect}
            createOpen={createOpen}
            onOpenCreate={() => setCreateOpen(true)}
            onCloseCreate={() => setCreateOpen(false)}
            onCreate={handleCreate}
            editingId={editingId}
            editFirstName={editFirstName}
            editLastName={editLastName}
            editNationality={editNationality}
            editDateOfBirth={editDateOfBirth}
            editPosition={editPosition}
            editHeightCm={editHeightCm}
            editJerseyNumber={editJerseyNumber}
            editPreferredFoot={editPreferredFoot}
            editPhotoUrl={editPhotoUrl}
            actionError={actionError}
            onStartEdit={startEdit}
            onEditFirstNameChange={setEditFirstName}
            onEditLastNameChange={setEditLastName}
            onEditNationalityChange={setEditNationality}
            onEditDateOfBirthChange={setEditDateOfBirth}
            onEditPositionChange={setEditPosition}
            onEditHeightCmChange={setEditHeightCm}
            onEditJerseyNumberChange={setEditJerseyNumber}
            onEditPreferredFootChange={setEditPreferredFoot}
            onEditPhotoSelect={handleEditPhotoSelect}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            deleteDialogOpen={deleteTargetId !== null}
            onRequestDelete={requestDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            view={view}
            onViewChange={setView}
            activeCount={activePlayers.length}
            archivedCount={archivedPlayers.length}
            onArchive={handleArchive}
            onRestore={handleRestore}
            deleteMessage={deleteMessage}
        />
    );
}