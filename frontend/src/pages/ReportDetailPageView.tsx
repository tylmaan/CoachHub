import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Chip, Paper, Typography } from "@mui/material";
import { ReportAvatar } from "../components/reports/ReportAvatar";
import type { Report } from "../types/report";
import { REPORT_KIND_LABELS, REPORT_PRIORITY_LABELS, reportKind, reportSubject } from "../types/report";

interface ReportDetailPageViewProps {
    report: Report;
    canDelete: boolean;
    actionError: string | null;
    onEdit: () => void;
    onDelete: () => void;
}

export function ReportDetailPageView({ 
    report, 
    canDelete, 
    actionError, 
    onEdit, 
    onDelete 
}: ReportDetailPageViewProps) {
    const created = new Date(report.createdAt).toLocaleString("pl-PL", { dateStyle: "long", timeStyle: "short" });

    return (
        <Paper sx={{ p: 3, maxWidth: 800 }}>
            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <ReportAvatar report={report} size={64} />
                <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h5">{reportSubject(report)}</Typography>
                    <Typography color="text.secondary">{report.title}</Typography>
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                <Chip size="small" variant="outlined" label={REPORT_KIND_LABELS[reportKind(report)]} />
                <Chip
                    size="small"
                    color={report.priority === "High" ? "error" : "default"}
                    variant={report.priority === "Normal" ? "outlined" : "filled"}
                    label={`Priorytet: ${REPORT_PRIORITY_LABELS[report.priority].toLowerCase()}`}
                />
                {report.matchId !== null && (
                    <Chip
                        size="small"
                        variant="outlined"
                        clickable
                        component={RouterLink}
                        to={`/matches/${report.matchId}`}
                        label={`Mecz z ${report.matchOpponent} · ${report.matchDate}`}
                    />
                )}
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {report.authorName} · {created}
            </Typography>

            <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.7, mb: 3 }}>
                {report.content}
            </Typography>

            {(report.canEdit || canDelete) && (
                <Box sx={{ display: "flex", gap: 1 }}>
                    {report.canEdit && <Button variant="outlined" onClick={onEdit}>Edytuj</Button>}
                    {canDelete && <Button color="error" onClick={onDelete}>Usuń</Button>}
                </Box>
            )}
        </Paper>
    );
}