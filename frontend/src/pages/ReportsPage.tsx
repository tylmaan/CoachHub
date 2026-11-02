import { useEffect, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { getReports } from '../api/reportsApi';
import type { Report, ReportKind } from '../types/report';
import { reportKind } from '../types/report';
import { ReportsPageView } from './ReportsPageView';

export function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [kindFilter, setKindFilter] = useState<ReportKind | "">("");
    const [authorFilter, setAuthorFilter] = useState("");

    function loadReports() {
        setLoading(true);
        getReports()
            .then(setReports)
            .catch(() => setError("Nie udało się pobrać raportów."))
            .finally(() => setLoading(false));
    }

    useEffect(() => {
        loadReports();
    }, []);

    const authors = [...new Map(reports.map((r) => [r.authorId, r.authorName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    const searchTerm = search.trim().toLowerCase();
    const filteredReports = reports.filter((r) =>
        (kindFilter === "" || reportKind(r) === kindFilter) &&
        (authorFilter === "" || r.authorId === authorFilter) &&
        (searchTerm === "" || `${r.title} ${r.content}`.toLowerCase().includes(searchTerm))
    );

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <ReportsPageView
            reports={filteredReports}
            totalCount={reports.length}
            authors={authors}
            search={search}
            onSearchChange={setSearch}
            kindFilter={kindFilter}
            onKindFilterChange={setKindFilter}
            authorFilter={authorFilter}
            onAuthorFilterChange={setAuthorFilter}
        />
    );
}