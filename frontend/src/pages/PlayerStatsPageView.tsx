import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Box,
} from '@mui/material';
import type { PlayerSeasonStats } from '../types/playerStats';

type SortField = "matches" | "minutes" | "goals" | "assists" | "yellowCards" | "redCards";

interface PlayerStatsPageViewProps {
    stats: PlayerSeasonStats[];
    seasons: string[];
    season: string;
    onSeasonChange: (season: string) => void;
    sortField: SortField;
    sortAsc: boolean;
    onSort: (field: SortField) => void;
}

function sortHeader(label: string, field: SortField, sortField: SortField, sortAsc: boolean, onSort: (field: SortField) => void) {
    return (
        <TableCell align="right">
            <TableSortLabel
                active={sortField === field}
                direction={sortAsc ? 'asc' : 'desc'}
                onClick={() => onSort(field)}
            >
                {label}
            </TableSortLabel>
        </TableCell>
    );
}

export function PlayerStatsPageView({ 
    stats,
    seasons,
    season,
    onSeasonChange,
    sortField,
    sortAsc,
    onSort
}: PlayerStatsPageViewProps) {
    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">
                    Statystyki zawodników
                </Typography>
                <TextField
                    select
                    size="small"
                    label="Sezon"
                    value={season}
                    onChange={(e) => onSeasonChange(e.target.value)}
                    sx={{ minWidth: 160 }}
                >
                    {seasons.map((s) => (
                        <MenuItem key={s} value={s}>
                            {s}
                        </MenuItem>
                    ))}
                </TextField>
            </Box>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Zawodnik</TableCell>
                            {sortHeader("Mecze", "matches", sortField, sortAsc, onSort)}
                            {sortHeader("Minuty", "minutes", sortField, sortAsc, onSort)}
                            {sortHeader("Bramki", "goals", sortField, sortAsc, onSort)}
                            {sortHeader("Asysty", "assists", sortField, sortAsc, onSort)}
                            {sortHeader("Żółte kartki", "yellowCards", sortField, sortAsc, onSort)}
                            {sortHeader("Czerwone kartki", "redCards", sortField, sortAsc, onSort)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.map((s) => (
                            <TableRow key={s.playerId}>
                                <TableCell>{s.firstName} {s.lastName}</TableCell>
                                <TableCell align="right">{s.matches}</TableCell>
                                <TableCell align="right">{s.minutes}</TableCell>
                                <TableCell align="right">{s.goals}</TableCell>
                                <TableCell align="right">{s.assists}</TableCell>
                                <TableCell align="right">{s.yellowCards}</TableCell>
                                <TableCell align="right">{s.redCards}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}