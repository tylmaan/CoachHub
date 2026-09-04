import { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import { getPlayers } from '../api/playersApi';
import type { Player } from '../types/player';

export function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPlayers()
            .then(setPlayers)
            .catch(() => setError('Nie udało się pobrać zawodników.'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <CircularProgress />;
    if (error) return <Alert severity="error">{error}</Alert>;

    return (
        <>
            <Typography variant="h4" sx={{ mb: 2 }}>
                Zawodnicy
            </Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Imię</TableCell>
                            <TableCell>Nazwisko</TableCell>
                            <TableCell>Data urodzenia</TableCell>
                            <TableCell>Pozycja</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {players.map((player) => (
                            <TableRow key={player.id}>
                                <TableCell>{player.firstName}</TableCell>
                                <TableCell>{player.lastName}</TableCell>
                                <TableCell>{player.dateOfBirth}</TableCell>
                                <TableCell>{player.position}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    );
}