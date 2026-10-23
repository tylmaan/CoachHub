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
    Avatar,
    Tooltip
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import type { PlayerSeasonStats } from '../types/playerStats';
import { BACKEND_ORIGIN } from '../api/axiosInstance';

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

function sortHeader(label: string, icon: React.ReactNode, field: SortField, sortField: SortField, sortAsc: boolean, onSort: (field: SortField) => void) {
    return (
        <TableCell align="center" sx={{ px: 3 }}>
            <Tooltip title={label}>
                <TableSortLabel
                    active={sortField === field}
                    direction={sortAsc ? 'asc' : 'desc'}
                    onClick={() => onSort(field)}
                >
                    {icon}
                </TableSortLabel>
            </Tooltip>
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
                            {sortHeader("Mecze", <CalendarTodayOutlinedIcon fontSize="small" />, "matches", sortField, sortAsc, onSort)}
                            {sortHeader("Minuty", <AccessTimeOutlinedIcon fontSize="small" />, "minutes", sortField, sortAsc, onSort)}
                            {sortHeader("Bramki", <SportsSoccerIcon fontSize="small" />, "goals", sortField, sortAsc, onSort)}
                            {sortHeader("Asysty", "A", "assists", sortField, sortAsc, onSort)}
                            {sortHeader("Żółte kartki", <Box sx={{ width: 11, height: 15, bgcolor: "yellow", borderRadius: 0.5 }} />, "yellowCards", sortField, sortAsc, onSort)}
                            {sortHeader("Czerwone kartki", <Box sx={{ width: 11, height: 15, bgcolor: "red", borderRadius: 0.5 }} />, "redCards", sortField, sortAsc, onSort)}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {stats.map((s) => (
                            <TableRow key={s.playerId}>
                                <TableCell>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                        {s.photoUrl ? (
                                            <Avatar src={`${BACKEND_ORIGIN}${s.photoUrl}`} />
                                        ) : (
                                            <Avatar>{s.firstName[0]}{s.lastName[0]}</Avatar>
                                        )}
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {s.firstName} {s.lastName}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.matches}</TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.minutes}</TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.goals}</TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.assists}</TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.yellowCards}</TableCell>
                                <TableCell align="center" sx={{ px: 3 }}>{s.redCards}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}