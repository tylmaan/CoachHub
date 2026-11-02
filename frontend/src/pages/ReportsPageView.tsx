import {
    Alert,
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import type { Report, ReportKind } from "../types/report";
import { REPORT_KIND_LABELS, reportKind } from "../types/report";

const KIND_COLORS: Record<ReportKind, "success" | "info" | "warning" | "secondary"> = {
    PlayerMatch: "success",
    PlayerGeneral: "info",
    TeamMatch: "warning",
    TeamGeneral: "secondary",
};

interface ReportsPageViewProps {
    reports: Report[];
    totalCount: number;
    authors: { id: string; name: string }[];
    search: string;
    onSearchChange: (value: string) => void;
    kindFilter: ReportKind | "";
    onKindFilterChange: (value: ReportKind | "") => void;
    authorFilter: string;
    onAuthorFilterChange: (value: string) => void;
        canDelete: boolean;
    actionError: string | null;
    formOpen: boolean;
    isEditing: boolean;
    title: string;
    onTitleChange: (value: string) => void;
    content: string;
    onContentChange: (value: string) => void;
    targetType: "team" | "player";
    onTargetTypeChange: (value: "team" | "player") => void;
    playerId: number | "";
    onPlayerIdChange: (value: number | "") => void;
    matchId: number | "";
    onMatchIdChange: (value: number | "") => void;
    playerOptions: { id: number; label: string }[];
    matchOptions: { id: number; label: string }[];
    formError: string | null;
    onOpenCreate: () => void;
    onOpenEdit: (report: Report) => void;
    onCloseForm: () => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    deleteDialogOpen: boolean;
    onRequestDelete: (id: number) => void;
    onCancelDelete: () => void;
    onConfirmDelete: () => void;
}

export function ReportsPageView({
    reports,
    totalCount,
    authors,
    search,
    onSearchChange,
    kindFilter,
    onKindFilterChange,
    authorFilter,
    onAuthorFilterChange,
    canDelete,
    actionError,
    formOpen,
    isEditing,
    title,
    onTitleChange,
    content,
    onContentChange,
    targetType,
    onTargetTypeChange,
    playerId,
    onPlayerIdChange,
    matchId,
    onMatchIdChange,
    playerOptions,
    matchOptions,
    formError,
    onOpenCreate,
    onOpenEdit,
    onCloseForm,
    onSubmit,
    deleteDialogOpen,
    onRequestDelete,
    onCancelDelete,
    onConfirmDelete
}: ReportsPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">Raporty</Typography>
                <Button variant="contained" onClick={onOpenCreate}>Dodaj raport</Button>
            </Box>

            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                <TextField
                    size="small"
                    label="Szukaj w tytule i treści"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    sx={{ flex: 1, minWidth: 220 }}
                />
                <TextField
                    select
                    size="small"
                    label="Rodzaj"
                    value={kindFilter}
                    onChange={(e) => onKindFilterChange(e.target.value as ReportKind | "")}
                    sx={{ minWidth: 190 }}
                >
                    <MenuItem value="">Wszystkie</MenuItem>
                    {(Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map((kind) => (
                        <MenuItem key={kind} value={kind}>{REPORT_KIND_LABELS[kind]}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label="Autor"
                    value={authorFilter}
                    onChange={(e) => onAuthorFilterChange(e.target.value)}
                    sx={{ minWidth: 190 }}
                >
                    <MenuItem value="">Wszyscy</MenuItem>
                    {authors.map((author) => (
                        <MenuItem key={author.id} value={author.id}>{author.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            {totalCount === 0 && (
                <Alert severity="info">Nie ma jeszcze żadnych raportów.</Alert>
            )}
            {totalCount > 0 && reports.length === 0 && (
                <Alert severity="info">Żaden raport nie pasuje do wybranych filtrów.</Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                {reports.map((report) => {
                    const kind = reportKind(report);
                    return (
                        <Paper key={report.id} sx={{ p: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                {report.title}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", my: 0.5 }}>
                                <Chip size="small" color={KIND_COLORS[kind]} label={REPORT_KIND_LABELS[kind]} />
                                {report.playerName && <Chip size="small" variant="outlined" label={report.playerName} />}
                                {report.matchOpponent && (
                                    <Chip
                                        size="small"
                                        variant="outlined"
                                        label={`${report.matchOpponent} · ${report.matchDate}`}
                                    />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                    {report.authorName} · {new Date(report.createdAt).toLocaleDateString("pl-PL")}
                                </Typography>
                            </Box>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ 
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    whiteSpace: "pre-line",
                                }}
                            >
                                {report.content}
                            </Typography>
                            {(report.canEdit || canDelete) && (
                                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                    {report.canEdit && (
                                        <Button size="small" onClick={() => onOpenEdit(report)}>Edytuj</Button>
                                    )}
                                    {canDelete && (
                                        <Button size="small" color="error" onClick={() => onRequestDelete(report.id)}>Usuń</Button>
                                    )}
                                </Box>
                            )}
                        </Paper>
                    )
                })}
            </Box>

            <Dialog open={formOpen} onClose={onCloseForm} fullWidth maxWidth="sm">
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
                                value={playerId}
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
                            value={matchId}
                            onChange={(e) => onMatchIdChange(e.target.value === "" ? "" : Number(e.target.value))}
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
                        <Button onClick={onCloseForm}>Anuluj</Button>
                        <Button type="submit" variant="contained">{isEditing ? "Zapisz" : "Dodaj"}</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                title="Usunąć raport?"
                message="Raport zostanie trwale usunięty. Tej operacji nie można cofnąć."
                onConfirm={onConfirmDelete}
                onCancel={onCancelDelete}
            />
        </>
    );
}