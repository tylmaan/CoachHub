import { useEffect, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import axios from "axios";
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../api/playersApi';
import type { Player } from '../types/player';
import { useAuth } from "../context/AuthContext";
import { uploadFile } from '../api/filesApi';
import { PlayersPageView } from './PlayersPageView';

function toNullableNumber(value: string): number | null {
    return value === "" ? null : Number(value);
}

export function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
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
    const [editDateOfBirth, setEditDateOfBirth] = useState("");
    const [editPosition, setEditPosition] = useState("");
    const [editHeightCm, setEditHeightCm] =useState("");
    const [editJerseyNumber, setEditJerseyNumber] = useState("");
    const [editPreferredFoot, setEditPreferredFoot] =useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const { roles, teamId } = useAuth();
    const canCreate = roles?.includes("Coach") || roles?.includes("AssistantCoach");
    const canEdit = canCreate;
    const canDelete = roles?.includes("Coach");

    function loadPlayers() {
        setLoading(true);
        getPlayers()
            .then(setPlayers)
            .catch(() => setError("Nie udało się pobrać zawodników."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadPlayers();
    }, []);

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
        } catch {
            setActionError("Nie udało się usunąć zawodnika.")
        }
    }

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <PlayersPageView
            players={players}
            canCreate={!!canCreate}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            firstName={firstName}
            lastName={lastName}
            dateOfBirth={dateOfBirth}
            position={position}
            heightCm={heightCm}
            jerseyNumber={jerseyNumber}
            preferredFoot={preferredFoot}
            photoUrl={photoUrl}
            formError={formError}
            onFirstNameChange={setFirstName}
            onLastNameChange={setLastName}
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
            onEditDateOfBirthChange={setEditDateOfBirth}
            onEditPositionChange={setEditPosition}
            onEditHeightCmChange={setEditHeightCm}
            onEditJerseyNumberChange={setEditJerseyNumber}
            onEditPreferredFootChange={setEditPreferredFoot}
            onEditPhotoSelect={handleEditPhotoSelect}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onDelete={handleDelete}
        />
    );
}