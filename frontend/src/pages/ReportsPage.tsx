import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersistentState } from '../hooks/usePersistentState';
import { Alert, CircularProgress } from '@mui/material';
import { getReports } from '../api/reportsApi';
import type { ReportKind, ReportPage as ReportPageData } from '../types/report';
import { ReportsPageView } from './ReportsPageView';
import { ReportFormDialog } from '../components/reports/ReportFormDialog';

const DAYS_STEP = 30;

function reportsWord(n: number) {
    if (n === 1) return "raport";
    const lastTwo = n % 100;
    const last = n % 10;
    return last >= 2 && last <= 4 && !(lastTwo >= 12 && lastTwo <= 14) ? "raporty" : "raportów";
}

export function ReportsPage() {
    const navigate = useNavigate();

    const [data, setData] = useState<ReportPageData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [formOpen, setFormOpen] = useState(false);

    const [search, setSearch] = usePersistentState("reports.search", "");
    const [kinds, setKinds] = usePersistentState<ReportKind[]>("reports.kinds", []);
    const [authorIds, setAuthorIds] = usePersistentState<string[]>("reports.authors", []);
    const [unreadOnly, setUnreadOnly] = usePersistentState("reports.unread", false);
    const [highOnly, setHighOnly] = usePersistentState("reports.high", false);
    const [days, setDays] = usePersistentState("reports.days", DAYS_STEP);

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        let cancelled = false;
        getReports({ 
            days,
            kinds,
            authors: authorIds,
            unreadOnly,
            highPriorityOnly: highOnly,
            search: debouncedSearch,
        })
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setError(null);
            })
            .catch(() => {
                if (!cancelled) setError("Nie udało się pobrać raportów.");
            });
        return () => { 
            cancelled = true;
        };
    }, [days, kinds, authorIds, unreadOnly, highOnly, debouncedSearch, reloadKey]);

    function toggleKind(kind: ReportKind) {
        setKinds(kinds.includes(kind) ? kinds.filter((k) => k !== kind) : [...kinds, kind]);
    }

    function toggleAuthor(id: string) {
        setAuthorIds(authorIds.includes(id) ? authorIds.filter((a) => a !== id) : [...authorIds, id]);
    }

    function clearFilters() {
        setSearch("");
        setKinds([]);
        setAuthorIds([]);
        setUnreadOnly(false);
        setHighOnly(false);
    }

    function handleSaved() {
        setFormOpen(false);
        setReloadKey(reloadKey + 1);
    }

    if (data === null) {
        return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
    }

    const isSearching = search.trim() !== "";
    const hasActiveFilters = isSearching || kinds.length > 0 || authorIds.length > 0 || unreadOnly || highOnly;
    const count = data.items.length;

    const countLabel = isSearching 
        ? `Znaleziono ${count} ${reportsWord(count)} (cała historia)`
        : `${count} ${reportsWord(count)} z ostatnich ${days} dni`;

    const emptyMessage = hasActiveFilters
        ? "Żaden raport nie pasuje do wybranych filtrów."
        : data.hasMore
            ? `Brak raportów z ostatnich ${days} dni.`
            : "Nie ma jeszcze żadnych raportów.";

    return (
        <>
            <ReportsPageView
                reports={data.items}
                authors={data.authors}
                unreadCount={data.unreadCount}
                hasMore={data.hasMore}
                countLabel={countLabel}
                emptyMessage={emptyMessage}
                hasActiveFilters={hasActiveFilters}
                error={error}
                search={search}
                onSearchChange={setSearch}
                kinds={kinds}
                onToggleKind={toggleKind}
                authorIds={authorIds}
                onToggleAuthor={toggleAuthor}
                unreadOnly={unreadOnly}
                onUnreadOnlyChange={setUnreadOnly}
                highOnly={highOnly}
                onHighOnlyChange={setHighOnly}
                onClearFilters={clearFilters}
                onLoadMore={() => setDays(days + DAYS_STEP)}
                onOpenReport={(id) => navigate(`/reports/${id}`)}
                onOpenCreate={() => setFormOpen(true)}
            />
            {formOpen && (
                <ReportFormDialog report={null} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
            )}
        </>
    );
}