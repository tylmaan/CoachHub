import {
    Alert,
    Box,
    Chip,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from "@mui/material";
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
}: ReportsPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">Raporty</Typography>
            </Box>

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
                        </Paper>
                    )
                })}
            </Box>
        </>
    );
}