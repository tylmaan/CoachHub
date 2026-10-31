import { useEffect, useState } from 'react';
import { CircularProgress, Alert } from '@mui/material';
import axios from "axios";
import { getTeams, createTeam, updateTeam, deleteTeam } from '../api/teamsApi';
import type { TeamSummary } from '../types/team';
import { useAuth } from "../context/AuthContext";
import { uploadFile } from '../api/filesApi';
import { TeamsPageView } from './TeamsPageView';
import { DEFAULT_KITS } from '../types/kit';
import type { TeamKits } from '../types/kit';

export function TeamsPage() {
    const [teams, setTeams] = useState<TeamSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [countryCode, setCountryCode] = useState<string | null>(null);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [kits, setKits] = useState<TeamKits>(DEFAULT_KITS);
    const [formError, setFormError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editCountryCode, setEditCountryCode] = useState<string | null>(null);
    const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
    const [editKits, setEditKits] = useState<TeamKits>(DEFAULT_KITS);
    const [actionError, setActionError] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const { roles } = useAuth();
    const canEdit = roles?.includes("Admin");
    const canDelete = roles?.includes("Admin");

    function loadTeams() {
        setLoading(true);
        getTeams()
            .then(setTeams)
            .catch(() => setError("Nie udało się pobrać drużyn"))
            .finally(() => setLoading(false));
    }
    
    useEffect(() => {
        loadTeams();
    }, []);

    async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setLogoUrl(url);
        } catch {
            setFormError("Nie udało się wgrać logo.");
        }
    }

    async function handleEditLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setEditLogoUrl(url);
        } catch {
            setActionError("Nie udało się wgrać logo.");
        }
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);
        try {
            await createTeam({ name, countryCode, logoUrl, ...kits });
            setName("");
            setCountryCode(null);
            setLogoUrl(null);
            setKits(DEFAULT_KITS);
            setCreateOpen(false);
            loadTeams();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć drużyny.");
            }
        }
    }

    function startEdit(team: TeamSummary) {
        setEditingId(team.id);
        setEditName(team.name);
        setEditCountryCode(team.countryCode);
        setEditLogoUrl(team.logoUrl);
        setEditKits({
            homeKit: team.homeKit,
            awayKit: team.awayKit,
            goalkeeperKit: team.goalkeeperKit
        });
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updateTeam(id, { name: editName, countryCode: editCountryCode, logoUrl: editLogoUrl, ...editKits });
            setEditingId(null);
            loadTeams();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: number) {
        setActionError(null);
        try {
            await deleteTeam(id);
            loadTeams();
        } catch {
            setActionError("Nie udało się usunąć drużyny.")
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

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

   return (
        <TeamsPageView
            teams={teams}
            isAdmin={!!roles?.includes("Admin")}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            name={name}
            countryCode={countryCode}
            logoUrl={logoUrl}
            kits={kits}
            formError={formError}
            onNameChange={setName}
            onCountryCodeChange={setCountryCode}
            onLogoSelect={handleLogoSelect}
            onKitsChange={setKits}
            createOpen={createOpen}
            onOpenCreate={() => setCreateOpen(true)}
            onCloseCreate={() => setCreateOpen(false)}
            onCreate={handleCreate}
            editingId={editingId}
            editName={editName}
            editCountryCode={editCountryCode}
            editLogoUrl={editLogoUrl}
            editKits={editKits}
            actionError={actionError}
            onStartEdit={startEdit}
            onEditNameChange={setEditName}
            onEditCountryCodeChange={setEditCountryCode}
            onEditLogoSelect={handleEditLogoSelect}
            onEditKitsChange={setEditKits}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            deleteDialogOpen={deleteTargetId !== null}
            onRequestDelete={requestDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
        />
    );
}