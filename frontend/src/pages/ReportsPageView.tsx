import { Alert, Box, Button, Chip, TextField, Typography } from "@mui/material";
import { ReportTile } from "../components/reports/ReportTile";
import type { Report, ReportKind } from "../types/report";
import { REPORT_KIND_LABELS } from "../types/report";

interface ReportsPageViewProps {
    reports: Report[];
    authors: { id: string; name: string }[];
    unreadCount: number;
    hasMore: boolean;
    countLabel: string;
    emptyMessage: string;
    hasActiveFilters: boolean;
    error: string | null;
    search: string;
    onSearchChange: (value: string) => void;
    kinds: ReportKind[];
    onToggleKind: (kind: ReportKind) => void;
    authorIds: string[];
    onToggleAuthor: (id: string) => void;
    unreadOnly: boolean;
    onUnreadOnlyChange: (value: boolean) => void;
    highOnly: boolean;
    onHighOnlyChange: (value: boolean) => void;
    onClearFilters: () => void;
    onLoadMore: () => void;
    onOpenReport: (id: number) => void;
    onOpenCreate: () => void;
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 56 }}>
                {label}
            </Typography>
            {children}
        </Box>
    );
}

function FilterChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <Chip
            label={label}
            clickable
            color={selected ? "primary" : "default"}
            variant={selected ? "filled" : "outlined"}
            onClick={onClick}
        />
    );
}

export function ReportsPageView({ 
    reports,
    authors,
    unreadCount,
    hasMore,
    countLabel,
    emptyMessage,
    hasActiveFilters,
    error,
    search,
    onSearchChange,
    kinds,
    onToggleKind,
    authorIds,
    onToggleAuthor,
    unreadOnly,
    onUnreadOnlyChange,
    highOnly,
    onHighOnlyChange,
    onClearFilters,
    onLoadMore,
    onOpenReport,
    onOpenCreate
}: ReportsPageViewProps) {
    return (
        <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                    <Typography variant="h4">Raporty</Typography>
                    {unreadCount > 0 && (
                        <Typography variant="body2" color="primary.light">
                            {unreadCount} nieprzeczytane
                        </Typography>
                    )}
                </Box>
                <Button variant="contained" onClick={onOpenCreate}>Dodaj raport</Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TextField
                fullWidth
                size="small"
                label="Szukaj w tytule, treści, zawodniku lub rywalu"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ mb: 2 }}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                <FilterRow label="Rodzaj">
                    {(Object.keys(REPORT_KIND_LABELS) as ReportKind[]).map((kind) => (
                        <FilterChip
                            key={kind}
                            label={REPORT_KIND_LABELS[kind]}
                            selected={kinds.includes(kind)}
                            onClick={() => onToggleKind(kind)}
                        />
                    ))}
                </FilterRow>
                <FilterRow label="Twórca">
                    {authors.map((author) => (
                        <FilterChip
                            key={author.id}
                            label={author.name}
                            selected={authorIds.includes(author.id)}
                            onClick={() => onToggleAuthor(author.id)}
                        />
                    ))}
                </FilterRow>
                <FilterRow label="Status">
                    <FilterChip label="Nieprzeczytane" selected={unreadOnly} onClick={() => onUnreadOnlyChange(!unreadOnly)} />
                    <FilterChip label="Wysoki priorytet" selected={highOnly} onClick={() => onHighOnlyChange(!highOnly)} />
                </FilterRow>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {countLabel}
            </Typography>

            {reports.length === 0 && (
                <Alert
                    severity="info"
                    action={hasActiveFilters && <Button size="small" onClick={onClearFilters}>Wyczyść filtry</Button>}
                >
                    {emptyMessage}
                </Alert>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                {reports.map((report) => (
                    <ReportTile key={report.id} report={report} onOpen={onOpenReport} />
                ))}
            </Box>

            {hasMore && (
                <Box sx={{ textAlign: "center", mt: 2 }}>
                    <Button onClick={onLoadMore}>Załaduj starsze raporty</Button>
                </Box>
            )}
        </>
    );
}