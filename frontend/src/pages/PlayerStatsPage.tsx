import { useEffect, useState } from 'react';
import { usePersistentState } from '../hooks/usePersistentState';
import { Alert, CircularProgress } from '@mui/material';
import { getPlayerStats } from '../api/playerStatsApi';
import type { PlayerSeasonStats } from '../types/playerStats';
import { PlayerStatsPageView } from './PlayerStatsPageView';

type SortField = "matches" | "minutes" | "goals" | "assists" | "yellowCards" | "redCards";

export function PlayerStatsPage() {
    const [stats, setStats] = useState<PlayerSeasonStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedSeason, setSelectedSeason] = usePersistentState("playerStats.season", "");
    const [sortField, setSortField] = usePersistentState<SortField>("playerStats.sortField", "goals");
    const [sortAsc, setSortAsc] = usePersistentState("playerStats.sortAsc", false);

    useEffect(() => {
        getPlayerStats()
            .then(data => {
                setStats(data);
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
    const season = seasons.includes(selectedSeason) ? selectedSeason : (seasons[0] || "");

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
            onSeasonChange={setSelectedSeason}
            sortField={sortField}
            sortAsc={sortAsc}
            onSort={handleSort}
        />
    );
}