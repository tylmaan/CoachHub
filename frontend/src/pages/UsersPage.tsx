import { useEffect, useState } from "react";
import { Alert, CircularProgress } from "@mui/material";
import axios from "axios";
import { getUsers, updateUser, deleteUser } from "../api/usersApi";
import { getTeams } from "../api/teamsApi";
import { register } from "../api/authApi";
import type { UserSummary } from "../types/user";
import type { Team } from "../types/team";
import { uploadFile } from "../api/filesApi";
import { UsersPageView } from "./UsersPageView";

type SortField = "email" | "roles" | "teamId" | "fullName";

export function UsersPage() {
    const [users, setUsers] = useState<UserSummary[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortField, setSortField] = useState<SortField>("email");
    const [sortAsc, setSortAsc] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState("Coach");
    const [editTeamId, setEditTeamId] = useState<number>(0);
    const [editFullName, setEditFullName] = useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const [registerOpen, setRegisterOpen] = useState(false);
    const [newFullName, setNewFullName] = useState("");
    const [newPhotoUrl, setNewPhotoUrl] = useState<string | null>(null);
    const [newEmail, setNewEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newRole, setNewRole] = useState("Coach");
    const [newTeamId, setNewTeamId] = useState<number | "">("");
    const [registerError, setRegisterError] = useState<string | null>(null);

    function loadUsers() {
        setLoading(true);
        getUsers() 
            .then(setUsers)
            .catch(() => setError("Nie udało się pobrać użytkowników."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadUsers();
        getTeams().then(setTeams).catch(() => {});
    }, []);

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
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

    async function handleNewPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const url = await uploadFile(file);
            setNewPhotoUrl(url);
        } catch {
            setRegisterError("Nie udało się wgrać zdjęcia.");
        }
    }

    function openRegisterDialog() {
        setRegisterOpen(true);
        setRegisterError(null);
    }

    function closeRegisterDialog() {
        setRegisterOpen(false);
        setNewFullName("");
        setNewPhotoUrl(null);
        setNewEmail("");
        setNewPassword("");
        setNewRole("Coach");
        setNewTeamId("");
        setRegisterError(null);
    }

    async function handleRegisterSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setRegisterError(null);
        try {
            await register({
                fullName: newFullName || null,
                photoUrl: newPhotoUrl,
                email: newEmail,
                password: newPassword,
                role: newRole,
                teamId: newRole === "Admin" ? null : (newTeamId as number),
            });
            closeRegisterDialog();
            loadUsers();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setRegisterError(err.response.data.join(" "));
            } else {
                setRegisterError("Nie udało się zarejestrować użytkownika.");
            }
        }
    }

    function startEdit(user: UserSummary) {
        setEditingId(user.id);
        setEditRole(user.roles[0] ?? "Coach");
        setEditTeamId(user.teamId ?? teams[0]?.id ?? 0);
        setEditFullName(user.fullName ?? "");
        setEditPhotoUrl(user.photoUrl);
        setActionError(null);
    }

    async function saveEdit(id: string) {
        setActionError(null)
        try {
            await updateUser(id, { role: editRole, teamId: editTeamId, fullName: editFullName, photoUrl: editPhotoUrl || null });
            setEditingId(null);
            loadUsers();
        } catch {
            setActionError("Nie udało się zapisać zmian.");
        }
    }

    async function handleDelete(id: string) {
        setActionError(null);
        try {
            await deleteUser(id);
            loadUsers();
        } catch {
            setActionError("Nie udało się usunąć użytkownika.")
        }
    }

    function requestDelete(id: string) {
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

    const sortedUsers = [...users].sort((a, b) => {
        let result = 0;
        if (sortField === "email") result = a.email.localeCompare(b.email);
        if (sortField === "roles") result = a.roles.join(",").localeCompare(b.roles.join(","));
        if (sortField === "teamId") result = (a.teamId ?? 0) - (b.teamId ?? 0);
        if (sortField === "fullName") result = (a.fullName ?? "").localeCompare(b.fullName ?? "");
        return sortAsc ? result : - result;
    });

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>

    return (
        <UsersPageView
            users={sortedUsers}
            teams={teams}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={handleSort}
            actionError={actionError}
            editingId={editingId}
            editRole={editRole}
            editTeamId={editTeamId}
            editFullName={editFullName}
            editPhotoUrl={editPhotoUrl}
            onStartEdit={startEdit}
            onEditFullNameChange={setEditFullName}
            onEditRoleChange={setEditRole}
            onEditTeamIdChange={setEditTeamId}
            onEditPhotoSelect={handleEditPhotoSelect}
            onSaveEdit={saveEdit}
            onCancelEdit={() => setEditingId(null)}
            deleteDialogOpen={deleteTargetId !== null}
            onRequestDelete={requestDelete}
            onCancelDelete={cancelDelete}
            onConfirmDelete={confirmDelete}
            registerOpen={registerOpen}
            newFullName={newFullName}
            newPhotoUrl={newPhotoUrl}
            newEmail={newEmail}
            newPassword={newPassword}
            newRole={newRole}
            newTeamId={newTeamId}
            registerError={registerError}
            onOpenRegisterDialog={openRegisterDialog}
            onCloseRegisterDialog={closeRegisterDialog}
            onNewFullNameChange={setNewFullName}
            onNewPhotoSelect={handleNewPhotoSelect}
            onNewEmailChange={setNewEmail}
            onNewPasswordChange={setNewPassword}
            onNewRoleChange={setNewRole}
            onNewTeamIdChange={setNewTeamId}
            onRegisterSubmit={handleRegisterSubmit}
        />
    );
}