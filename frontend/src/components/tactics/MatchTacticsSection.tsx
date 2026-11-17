import { useState, useEffect } from 'react';
import {
    Alert,
    Box,
    Button,
    Card,
    CardActionArea,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog';
import { TacticalBoardTile } from './TacticalBoardTile';
import { TacticalBoardEditor } from './TacticalBoardEditor';
import { createTacticalScheme, deleteTacticalScheme, getTacticalSchemes } from '../../api/tacticalSchemesApi';
import { EMPTY_BOARD } from '../../types/tacticalBoard';
import type { TacticalScheme } from '../../types/tacticalScheme';

interface MatchTacticsSectionProps {
    matchId: number;
}

export function MatchTacticsSection({ matchId }: MatchTacticsSectionProps) {
    const { roles } = useAuth();
    const canEdit = !!roles?.some((r) => r === "Coach" || r === "AssistantCoach");
    const canDelete = !!roles?.some((r) => r === "Coach");
    const [editing, setEditing] = useState<TacticalScheme | null>(null);
    const [schemes, setSchemes] = useState<TacticalScheme[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<TacticalScheme | null>(null);

    useEffect(() => {
        getTacticalSchemes(matchId)
            .then(setSchemes)
            .catch(() => setError("Nie udało się pobrać tablic taktycznych."));
    }, [matchId]);

    function closeCreate() {
        setCreateOpen(false);
        setNewName("");
        setCreateError(null);
    }

    async function handleCreate(e: React.SyntheticEvent) {
        e.preventDefault();
        const name = newName.trim();
        if (!name) return;
        try {
            const created = await createTacticalScheme(matchId, { name, data: JSON.stringify(EMPTY_BOARD) });
            setSchemes((prev) => [...prev, created]);
            closeCreate();
        } catch {
            setCreateError("Nie udało się dodać tablicy.");
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        try {
            await deleteTacticalScheme(deleteTarget.id);
            setSchemes((prev) => prev.filter((s) => s.id !== deleteTarget.id));
        } catch {
            setError("Nie udało się usunąć tablicy.");
        } finally {
            setDeleteTarget(null);
        }
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Taktyka</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 2 }}>
                {schemes.map((scheme) => (
                    <TacticalBoardTile
                        key={scheme.id}
                        scheme={scheme}
                        canDelete={canDelete}
                        onOpen={setEditing}
                        onDelete={setDeleteTarget}
                    />
                ))}
                {canEdit && (
                    <Card variant="outlined" sx={{ borderStyle: "dashed" }}>
                        <CardActionArea
                            onClick={() => setCreateOpen(true)}
                            sx={{
                                height: "100%",
                                minHeight: 160,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 1,
                                color: "text.secondary",
                            }}
                        >
                            <AddIcon />
                            <Typography>Nowa tablica</Typography>
                        </CardActionArea>
                    </Card>
                )}
            </Box>

            {schemes.length === 0 && !canEdit && (
                <Typography color="text.secondary">Brak tablic taktycznych.</Typography>
            )}

            <Dialog open={createOpen} onClose={closeCreate} maxWidth="xs" fullWidth>
                <form onSubmit={handleCreate}>
                    <DialogTitle>Nowa tablica</DialogTitle>
                    <DialogContent>
                        {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
                        <TextField
                            autoFocus
                            fullWidth
                            label="Nazwa"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                            sx={{ mt: 1 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={closeCreate}>Anuluj</Button>
                        <Button type="submit" variant="contained" disabled={!newName.trim()}>Utwórz</Button>
                    </DialogActions>
                </form>
            </Dialog>
            
            {editing && (
                <TacticalBoardEditor 
                    key={editing.id}
                    scheme={editing}
                    canEdit={canEdit}
                    onClose={() => setEditing(null)}
                />
            )}
            
            <ConfirmDeleteDialog
                open={deleteTarget !== null}
                title="Usunąć tablicę?"
                message={`Tablica „${deleteTarget?.name ?? ""}” zostanie usunięta bezpowrotnie.`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </Box>
    );
}