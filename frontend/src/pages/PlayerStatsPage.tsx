import { useEffect, useState } from 'react';
import { Alert, CircularProgress } from '@mui/material';
import { getPlayerStats } from '../api/playerStatsApi';
import type { PlayerSeasonStats } from '../types/playerStats';
import { PlayerStatsPageView } from './PlayerStatsPageView';

type SortField = "matches" | "minutes" | "goals" | "assists" | "yellowCards" | "redCards";

export function PlayerStatsPage() {
    const [stats, setStats] = useState<PlayerSeasonStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [season, setSeason] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("goals");
    const [sortAsc, setSortAsc] = useState(false);

    useEffect(() => {
        getPlayerStats()
            .then(data => {
                setStats(data);
                const seasons = [...new Set(data.map((s) => s.season))].sort().reverse();
                setSeason(seasons[0] ?? "");
            })
            .catch(() => setError("Nie udało się pobrać statystyk"))
            .finally(() => setLoading(false));
    }, []);

    function handleSort(field: SortField) {
        if (field === sortField) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(false);
        }
    }

    const seasons = [...new Set(stats.map((s) => s.season))].sort().reverse();

    const filteredSorted = stats
        .filter((s) => s.season === season)
        .sort((a, b) => {
            const result = a[sortField] - b[sortField];
            return sortAsc ? result : -result;
        });
    
    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <PlayerStatsPageView
            stats={filteredSorted}
            seasons={seasons}
            season={season}
            onSeasonChange={setSeason}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={handleSort}
        />
    );
}