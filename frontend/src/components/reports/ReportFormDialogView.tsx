import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import type { ReportPriority } from "../../types/report";
import { REPORT_PRIORITY_LABELS } from "../../types/report";

interface ReportFormDialogViewProps {
    isEditing: boolean;
    title: string;
    onTitleChange: (value: string) => void;
    content: string;
    onContentChange: (value: string) => void;
    priority: ReportPriority;
    onPriorityChange: (value: ReportPriority) => void;
    targetType: "team" | "player";
    onTargetTypeChange: (value: "team" | "player") => void;
    playerId: number | null;
    onPlayerIdChange: (value: number | null) => void;
    matchId: number | null;
    onMatchIdChange: (value: number | null) => void;
    playerOptions: { id: number, label: string }[];
    matchOptions: { id: number, label: string }[];
    formError: string | null;
    onSubmit: (e: React.SyntheticEvent) => void;
    onClose: () => void;
}

export function ReportFormDialogView({
    isEditing,
    title,
    onTitleChange,
    content,
    onContentChange,
    priority,
    onPriorityChange,
    targetType,
    onTargetTypeChange,
    playerId,
    onPlayerIdChange,
    matchId,
    onMatchIdChange,
    playerOptions,
    matchOptions,
    formError,
    onSubmit,
    onClose
}: ReportFormDialogViewProps) {
    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="sm">
            <Box component="form" onSubmit={onSubmit}>
                <DialogTitle>{isEditing ? "Edytuj raport" : "Nowy raport"}</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField
                            label="Tytuł"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            required
                            slotProps={{ htmlInput: { maxLength: 200 } }}
                        />
                        <Box>
                            <Typography variant="caption" color="text.secondary">Priorytet</Typography>
                            <ToggleButtonGroup
                                exclusive
                                fullWidth
                                size="small"
                                value={priority}
                                onChange={(_, value) => value && onPriorityChange(value)}
                            >
                                {(Object.keys(REPORT_PRIORITY_LABELS) as ReportPriority[]).map((p) => (
                                    <ToggleButton key={p} value={p}>{REPORT_PRIORITY_LABELS[p]}</ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Box>
                        <ToggleButtonGroup
                            exclusive
                            fullWidth
                            value={targetType}
                            onChange={(_, value) => value && onTargetTypeChange(value)}
                        >
                            <ToggleButton value="team">Cała drużyna</ToggleButton>
                            <ToggleButton value="player">Zawodnik</ToggleButton>
                        </ToggleButtonGroup>
                        {targetType === "player" && (
                            <TextField
                                select
                                label="Zawodnik"
                                value={playerId ?? ""}
                                onChange={(e) => onPlayerIdChange(Number(e.target.value))}
                                required
                            >
                                {playerOptions.map((p) => (
                                    <MenuItem key={p.id} value={p.id}>{p.label}</MenuItem>
                                ))}
                            </TextField>
                        )}
                        <TextField
                            select
                            label="Dotyczy meczu (opcjonalnie)"
                            value={matchId ?? ""}
                            onChange={(e) => onMatchIdChange(e.target.value === "" ? null : Number(e.target.value))}
                        >
                            <MenuItem value="">Bez meczu</MenuItem>
                            {matchOptions.map((m) => (
                                <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                            ))}
                        </TextField>
                        <TextField
                            label="Treść"
                            value={content}
                            onChange={(e) => onContentChange(e.target.value)}
                            required
                            multiline
                            minRows={5}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose}>Anuluj</Button>
                        <Button type="submit" variant="contained">{isEditing ? "Zapisz" : "Dodaj"}</Button>
                    </DialogActions>
                </Box>
        </Dialog>
    );
}