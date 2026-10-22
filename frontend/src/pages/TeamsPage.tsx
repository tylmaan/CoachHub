import { useEffect, useState } from 'react';
import { CircularProgress, Alert } from '@mui/material';
import axios from "axios";
import { getTeams, createTeam, updateTeam, deleteTeam } from '../api/teamsApi';
import type { Team } from '../types/team';
import { useAuth } from "../context/AuthContext";
import { uploadFile } from '../api/filesApi';
import { TeamsPageView } from './TeamsPageView';

export function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [foundedDate, setFoundedDate] = useState("");
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editFoundedDate, setEditFoundedDate] = useState("");
    const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

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
            await createTeam({ name, foundedDate, logoUrl });
            setName("");
            setFoundedDate("");
            setLogoUrl(null);
            loadTeams();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się utworzyć drużyny.");
            }
        }
    }

    function startEdit(team: Team) {
        setEditingId(team.id);
        setEditName(team.name);
        setEditFoundedDate(team.foundedDate);
        setEditLogoUrl(team.logoUrl);
        setActionError(null);
    }

    async function saveEdit(id: number) {
        setActionError(null);
        try {
            await updateTeam(id, { name: editName, foundedDate: editFoundedDate, logoUrl: editLogoUrl });
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

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

   return (
        <TeamsPageView
            teams={teams}
            isAdmin={!!roles?.includes("Admin")}
            canEdit={!!canEdit}
            canDelete={!!canDelete}
            name={name}
            foundedDate={foundedDate}
            logoUrl={logoUrl}
            formError={formError}
            onNameChange={setName}
            onFoundedDateChange={setFoundedDate}
            onLogoSelect={handleLogoSelect}
            onCreate={handleCreate}
            editingId={editingId}
            editName={editName}
            editFoundedDate={editFoundedDate}
            editLogoUrl={editLogoUrl}
            actionError={actionError}
            onStartEdit={startEdit}
            onEditNameChange={setEditName}
            onEditFoundedDateChange={setEditFoundedDate}
            onEditLogoSelect={handleEditLogoSelect}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            onDelete={handleDelete}
        />
    );
}