import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Alert,
    Box,
    TextField,
    Button,
    MenuItem,
    Avatar,
} from "@mui/material";
import type { Match } from "../types/match";
import { MATCH_TYPE_LABELS } from "../constants/labels";
import { BACKEND_ORIGIN } from "../api/axiosInstance";

const MATCH_TYPES = ["League", "Cup", "Friendly"];

interface MatchesPageViewProps {
    matches: Match[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;

    date: string;
    opponent: string;
    season: string;
    scoreFor: string;
    scoreAgainst: string;
    isHome: string;
    matchType: string;
    round: string;
    opponentLogoUrl: string | null;
    formError: string | null;
    onDateChange: (value: string) => void;
    onOpponentChange: (value: string) => void;
    onSeasonChange: (value: string) => void;
    onScoreForChange: (value: string) => void;
    onScoreAgainstChange: (value: string) => void;
    onIsHomeChange: (value: string) => void;
    onMatchTypeChange: (value: string) => void;
    onRoundChange: (value: string) => void;
    onOpponentLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onCreate: (e: React.SyntheticEvent) => void;

    editingId: number | null;
    editDate: string;
    editOpponent: string;
    editSeason: string;
    editScoreFor: string;
    editScoreAgainst: string;
    editIsHome: string;
    editMatchType: string;
    editRound: string;
    editOpponentLogoUrl: string;
    actionError: string | null;
    onStartEdit: (match: Match) => void;
    onEditDateChange: (value: string) => void;
    onEditOpponentChange: (value: string) => void;
    onEditSeasonChange: (value: string) => void;
    onEditScoreForChange: (value: string) => void;
    onEditScoreAgainstChange: (value: string) => void;
    onEditIsHomeChange: (value: string) => void;
    onEditMatchTypeChange: (value: string) => void;
    onEditRoundChange: (value: string) => void;
    onEditOpponentLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: number) => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
}

export function MatchesPageView({
    matches,
    canCreate,
    canEdit,
    canDelete,
    date,
    opponent,
    season,
    scoreFor,
    scoreAgainst,
    isHome,
    matchType,
    round,
    opponentLogoUrl,
    formError,
    onDateChange,
    onOpponentChange,
    onSeasonChange,
    onScoreForChange,
    onScoreAgainstChange,
    onIsHomeChange,
    onMatchTypeChange,
    onRoundChange,
    onOpponentLogoSelect,
    onCreate,
    editingId,
    editDate,
    editOpponent,
    editSeason,
    editScoreFor,
    editScoreAgainst,
    editIsHome,
    editMatchType,
    editRound,
    editOpponentLogoUrl,
    actionError,
    onStartEdit,
    onEditDateChange,
    onEditOpponentChange,
    onEditSeasonChange,
    onEditScoreForChange,
    onEditScoreAgainstChange,
    onEditIsHomeChange,
    onEditMatchTypeChange,
    onEditRoundChange,
    onEditOpponentLogoSelect,
    onSaveEdit,
    onCancelEdit,
    onDelete
}: MatchesPageViewProps) {
    return (
            <>
                <Typography variant="h4"  sx={{ mb: 2 }}>
                    Mecze
                </Typography>
    
                {canCreate && (
                    <Box 
                        component="form"
                        onSubmit={onCreate}
                        sx={{ mb: 3, display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}
                    >
                        {formError && <Alert severity="error">{formError}</Alert>}
                        <TextField
                            label="Data"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Przeciwnik"
                            value={opponent}
                            onChange={(e) => onOpponentChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Sezon"
                            value={season}
                            onChange={(e) => onSeasonChange(e.target.value)}
                            required
                        />
                        <TextField
                            label="Bramki strzelone"
                            value={scoreFor}
                            onChange={(e) => onScoreForChange(e.target.value)}
                        />
                        <TextField
                            label="Bramki stracone"
                            value={scoreAgainst}
                            onChange={(e) => onScoreAgainstChange(e.target.value)}
                        />
                        <TextField
                            select
                            label="Typ meczu"
                            value={matchType}
                            onChange={(e) => onMatchTypeChange(e.target.value)}
                            sx={{ minWidth: 140 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            {MATCH_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                            ))}
                        </TextField>
                        {matchType === "League" && (
                            <TextField
                                label="Kolejka"
                                type="number"
                                value={round}
                                onChange={(e) => onRoundChange(e.target.value)}
                                sx={{ width: 100 }}
                            />
                        )}
                        <TextField
                            select
                            label="Dom/Wyjazd"
                            value={isHome}
                            onChange={(e) => onIsHomeChange(e.target.value)}
                            sx={{ minWidth: 120 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            <MenuItem value="true">Dom</MenuItem>
                            <MenuItem value="false">Wyjazd</MenuItem>
                        </TextField>
                        {opponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${opponentLogoUrl}`} variant="rounded" />}
                        <Button component="label" variant="outlined">
                            Logo przeciwnika
                            <input type="file" accept="image/png, image/jpeg" hidden onChange={onOpponentLogoSelect} />
                        </Button>
                        <Button type="submit" variant="contained">
                            Dodaj mecz
                        </Button>
                    </Box>
                )}
                
                {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}
    
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Logo</TableCell>
                                <TableCell>Data</TableCell>
                                <TableCell>Przeciwnik</TableCell>
                                <TableCell>Sezon</TableCell>
                                <TableCell>Wynik</TableCell>
                                <TableCell>Dom/Wyjazd</TableCell>
                                <TableCell>Typ meczu</TableCell>
                                <TableCell>Kolejka</TableCell>
                                {(canEdit || canDelete) && <TableCell>Akcje</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {matches.map((match) => (
                                editingId === match.id ? (
                                    <TableRow key={match.id}>
                                        <TableCell>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                {editOpponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${editOpponentLogoUrl}`} variant="rounded" />}
                                                <Button component="label" size="small">
                                                    Zmień logo
                                                    <input type="file" accept="image/png, image/jpeg" hidden onChange={onEditOpponentLogoSelect} />
                                                </Button>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="date"
                                                slotProps={{ inputLabel: { shrink: true } }}
                                                value={editDate}
                                                onChange={(e) => onEditDateChange(e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={editOpponent}
                                                onChange={(e) => onEditOpponentChange(e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                value={editSeason}
                                                onChange={(e) => onEditSeasonChange(e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={editScoreFor}
                                                    onChange={(e) => onEditScoreForChange(e.target.value)}
                                                    sx={{ width: 70 }}
                                                />
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={editScoreAgainst}
                                                    onChange={(e) => onEditScoreAgainstChange(e.target.value)}
                                                    sx={{ width: 70 }}
                                                />
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                size="small"
                                                value={editIsHome}
                                                onChange={(e) => onEditIsHomeChange(e.target.value)}
                                                sx={{ minWidth: 100 }}
                                            >
                                                <MenuItem value="">--</MenuItem>
                                                <MenuItem value="true">Dom</MenuItem>
                                                <MenuItem value="false">Wyjazd</MenuItem>
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                select
                                                size="small"
                                                value={editMatchType}
                                                onChange={(e) => onEditMatchTypeChange(e.target.value)}
                                                sx={{ minWidth: 120 }}
                                            >
                                                <MenuItem value="">--</MenuItem>
                                                {MATCH_TYPES.map((t) => (
                                                    <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                                                ))}
                                            </TextField>
                                        </TableCell>
                                        <TableCell>
                                            {editMatchType === "League" && (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={editRound}
                                                    onChange={(e) => onEditRoundChange(e.target.value)}
                                                    sx={{ width: 70 }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1 }}>
                                                <Button size="small" variant="contained" onClick={() => onSaveEdit(match.id)}>Zapisz</Button>
                                                <Button size="small" onClick={onCancelEdit}>Anuluj</Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow key={match.id}>
                                        <TableCell>
                                            {match.opponentLogoUrl ? (
                                                <Avatar src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`} variant="rounded" />
                                            ) : (
                                                <Avatar variant="rounded">{match.opponent[0]}</Avatar> 
                                            )}
                                        </TableCell>
                                        <TableCell>{match.date}</TableCell>
                                        <TableCell>{match.opponent}</TableCell>
                                        <TableCell>{match.season}</TableCell>
                                        <TableCell>{match.scoreFor ?? "-"} : {match.scoreAgainst ?? "-"}</TableCell>
                                        <TableCell>{match.isHome === null ? "-" : match.isHome ? "Dom" : "Wyjazd"}</TableCell>
                                        <TableCell>{match.matchType ? MATCH_TYPE_LABELS[match.matchType] : "-"}</TableCell>
                                        <TableCell>{match.round ?? "-"}</TableCell>
                                        {(canEdit || canDelete) && (
                                            <TableCell>
                                                <Box sx={{ display: "flex", gap: 1 }}>
                                                    {canEdit && <Button size="small" onClick={() => onStartEdit(match)}>Edytuj</Button>}
                                                    {canDelete && <Button size="small" color="error" onClick={() => onDelete(match.id)}>Usuń</Button>}
                                                </Box>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </>
    );
        
}