import {
    Paper,
    Typography,
    Alert,
    Box,
    TextField,
    Button,
    MenuItem,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    ListSubheader
} from "@mui/material";
import type { Match } from "../types/match";
import { MATCH_TYPE_LABELS } from "../constants/labels";
import {  CATEGORY_COLORS, categoryOfMatch} from "../constants/competitions";
import { BACKEND_ORIGIN } from "../api/axiosInstance";
import { Link as RouterLink} from "react-router-dom";
import type { CompetitionGroup } from "../constants/competitions";

const MATCH_TYPES = ["League", "Cup", "Friendly"];

interface MatchesPageViewProps {
    matchesBySeason: { season: string; matches: Match[] }[];
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    competitionGroups: CompetitionGroup[];
    date: string;
    opponent: string;
    season: string;
    scoreFor: string;
    scoreAgainst: string;
    isHome: string;
    matchType: string;
    competition: string;
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
    onCompetitionChange: (value: string) => void;
    onRoundChange: (value: string) => void;
    onOpponentLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    createOpen: boolean;
    onOpenCreate: () => void;
    onCloseCreate: () => void;
    onCreate: (e: React.SyntheticEvent) => void;

    editingId: number | null;
    editDate: string;
    editOpponent: string;
    editSeason: string;
    editScoreFor: string;
    editScoreAgainst: string;
    editIsHome: string;
    editMatchType: string;
    editCompetition: string;
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
    onEditCompetitionChange: (value: string) => void;
    onEditRoundChange: (value: string) => void;
    onEditOpponentLogoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSaveEdit: (id: number) => void;
    onCancelEdit: () => void;
    onDelete: (id: number) => void;
}

export function MatchesPageView({
    matchesBySeason,
    canCreate,
    canEdit,
    canDelete,
    competitionGroups,
    date,
    opponent,
    season,
    scoreFor,
    scoreAgainst,
    isHome,
    matchType,
    competition,
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
    onCompetitionChange,
    onRoundChange,
    onOpponentLogoSelect,
    createOpen,
    onOpenCreate,
    onCloseCreate,
    onCreate,
    editingId,
    editDate,
    editOpponent,
    editSeason,
    editScoreFor,
    editScoreAgainst,
    editIsHome,
    editMatchType,
    editCompetition,
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
    onEditCompetitionChange,
    onEditRoundChange,
    onEditOpponentLogoSelect,
    onSaveEdit,
    onCancelEdit,
    onDelete
}: MatchesPageViewProps) {
    function typeChipLabel(match: Match): string {
        if (match.matchType === "Cup") return match.competition ?? MATCH_TYPE_LABELS.Cup;
        if (match.matchType) return MATCH_TYPE_LABELS[match.matchType] ?? match.matchType;
        return "-";
    }

    function renderCompetitionOptions() {
        return competitionGroups.flatMap((group) => [
            <ListSubheader 
                key={`h-${group.key}`}
                sx={{ 
                    bgcolor: CATEGORY_COLORS[group.category].bg,
                    color: CATEGORY_COLORS[group.category].fg,
                    fontWeight: 500,
                }}
            >
                {group.label}
            </ListSubheader>,
            ...group.names.map((name) => (
                <MenuItem key={name} value={name}>{name}</MenuItem>
            )),
        ]);
    }

    function renderMatchRow(match: Match) {
        const category = categoryOfMatch(match.matchType, match.competition);
        const colors = CATEGORY_COLORS[category];
        return (
            <Box
                key={match.id}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    borderLeft: "5px solid",
                    borderLeftColor: colors.bar,
                    "&:last-of-type": { borderBottom: "none" },
                }}
            >
                {match.opponentLogoUrl ? (
                    <Avatar src={`${BACKEND_ORIGIN}${match.opponentLogoUrl}`} variant="rounded" />
                ) : (
                    <Avatar variant="rounded">{match.opponent[0]}</Avatar>
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2">{match.opponent}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {match.date}{match.isHome !== null && ` · ${match.isHome ? "Dom" : "Wyjazd"}`}
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {match.matchType && <Chip size="small" label={typeChipLabel(match)} sx={{ bgcolor: colors.bg, color: colors.fg }} />}
                    {match.round && <Chip size="small" label={match.round} variant="outlined" />}
                </Box>
                <Typography variant="body1" sx={{ minWidth: 56, textAlign: "center" }}>
                    {match.scoreFor ?? "-"} : {match.scoreAgainst ?? "-"}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                    <Button size="small" component={RouterLink} to={`/matches/${match.id}`}>Szczegóły</Button>
                    {canEdit && <Button size="small" onClick={() => onStartEdit(match)}>Edytuj</Button>}
                    {canDelete && <Button size="small" color="error" onClick={() => onDelete(match.id)}>Usuń</Button>}
                </Box>
            </Box>
        );
    }
    
    return (
            <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h4">Mecze</Typography>
                {canCreate && (
                    <Button variant="contained" onClick={onOpenCreate}>Dodaj mecz</Button>
                )}
            </Box>

            {actionError && <Alert severity="error" sx={{ mb: 2 }}>{actionError}</Alert>}

            {matchesBySeason.map((group) => (
                <Box key={group.season} sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Sezon: {group.season}</Typography>
                    <Paper sx={{ overflow: "hidden" }}>
                        {group.matches.map(renderMatchRow)}
                    </Paper>
                </Box>
            ))}

            <Dialog open={createOpen} onClose={onCloseCreate} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={onCreate}>
                    <DialogTitle>Nowy mecz</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1 }}>
                        {formError && <Alert severity="error" sx={{ width: "100%" }}>{formError}</Alert>}
                        <TextField
                            label="Data"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={date}
                            onChange={(e) => onDateChange(e.target.value)}
                            required
                            sx={{ width: 160 }}
                        />
                        <TextField
                            label="Przeciwnik"
                            value={opponent}
                            onChange={(e) => onOpponentChange(e.target.value)}
                            required
                            sx={{ flex: 1, minWidth: 180 }}
                        />
                        <TextField
                            label="Sezon"
                            value={season}
                            onChange={(e) => onSeasonChange(e.target.value)}
                            required
                            sx={{ width: 120 }}
                        />
                        <TextField
                            label="Bramki strzelone"
                            value={scoreFor}
                            onChange={(e) => onScoreForChange(e.target.value)}
                            sx={{ width: 140 }}
                        />
                        <TextField
                            label="Bramki stracone"
                            value={scoreAgainst}
                            onChange={(e) => onScoreAgainstChange(e.target.value)}
                            sx={{ width: 140 }}
                        />
                        <TextField
                            select
                            label="Dom/Wyjazd"
                            value={isHome}
                            onChange={(e) => onIsHomeChange(e.target.value)}
                            sx={{ width: 140 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            <MenuItem value="true">Dom</MenuItem>
                            <MenuItem value="false">Wyjazd</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Typ meczu"
                            value={matchType}
                            onChange={(e) => onMatchTypeChange(e.target.value)}
                            sx={{ width: 160 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            {MATCH_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                            ))}
                        </TextField>
                        {matchType === "Cup" && (
                            <TextField
                                select
                                label="Rozgrywki pucharowe"
                                value={competition}
                                onChange={(e) => onCompetitionChange(e.target.value)}
                                sx={{ width: 220 }}
                            >
                                <MenuItem value="">--</MenuItem>
                                {renderCompetitionOptions()}
                            </TextField>
                        )}
                        {(matchType === "League" || matchType === "Cup") && (
                            <TextField
                                label="Kolejka / Runda"
                                value={round}
                                onChange={(e) => onRoundChange(e.target.value)}
                                sx={{ width: 160 }}
                            />
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {opponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${opponentLogoUrl}`} variant="rounded" />}
                            <Button component="label" variant="outlined">
                                Logo przeciwnika
                                <input type="file" accept="image/png, image/jpeg" hidden onChange={onOpponentLogoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCloseCreate}>Anuluj</Button>
                        <Button type="submit" variant="contained">Dodaj</Button>
                    </DialogActions>
                </Box>
            </Dialog>

            <Dialog open={editingId !== null} onClose={onCancelEdit} fullWidth maxWidth="sm">
                <Box component="form" onSubmit={(e) => { e.preventDefault(); if (editingId !== null) onSaveEdit(editingId); }}>
                    <DialogTitle>Edytuj mecz</DialogTitle>
                    <DialogContent sx={{ display: "flex", flexWrap: "wrap", gap: 2, pt: 1 }}>
                        <TextField
                            label="Data"
                            type="date"
                            slotProps={{ inputLabel: { shrink: true } }}
                            value={editDate}
                            onChange={(e) => onEditDateChange(e.target.value)}
                            required
                            sx={{ width: 160 }}
                        />
                        <TextField
                            label="Przeciwnik"
                            value={editOpponent}
                            onChange={(e) => onEditOpponentChange(e.target.value)}
                            required
                            sx={{ flex: 1, minWidth: 180 }}
                        />
                        <TextField
                            label="Sezon"
                            value={editSeason}
                            onChange={(e) => onEditSeasonChange(e.target.value)}
                            required
                            sx={{ width: 120 }}
                        />
                        <TextField
                            label="Bramki strzelone"
                            value={editScoreFor}
                            onChange={(e) => onEditScoreForChange(e.target.value)}
                            sx={{ width: 140 }}
                        />
                        <TextField
                            label="Bramki stracone"
                            value={editScoreAgainst}
                            onChange={(e) => onEditScoreAgainstChange(e.target.value)}
                            sx={{ width: 140 }}
                        />
                        <TextField
                            select
                            label="Dom/Wyjazd"
                            value={editIsHome}
                            onChange={(e) => onEditIsHomeChange(e.target.value)}
                            sx={{ width: 140 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            <MenuItem value="true">Dom</MenuItem>
                            <MenuItem value="false">Wyjazd</MenuItem>
                        </TextField>
                        <TextField
                            select
                            label="Typ meczu"
                            value={editMatchType}
                            onChange={(e) => onEditMatchTypeChange(e.target.value)}
                            sx={{ width: 160 }}
                        >
                            <MenuItem value="">--</MenuItem>
                            {MATCH_TYPES.map((t) => (
                                <MenuItem key={t} value={t}>{MATCH_TYPE_LABELS[t]}</MenuItem>
                            ))}
                        </TextField>
                        {editMatchType === "Cup" && (
                            <TextField
                                select
                                label="Rozgrywki pucharowe"
                                value={editCompetition}
                                onChange={(e) => onEditCompetitionChange(e.target.value)}
                                sx={{ width: 220 }}
                            >
                                <MenuItem value="">--</MenuItem>
                                {renderCompetitionOptions()}
                            </TextField>
                        )}
                        {(editMatchType === "League" || editMatchType === "Cup") && (
                            <TextField
                                label="Kolejka / Runda"
                                value={editRound}
                                onChange={(e) => onEditRoundChange(e.target.value)}
                                sx={{ width: 160 }}
                            />
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {editOpponentLogoUrl && <Avatar src={`${BACKEND_ORIGIN}${editOpponentLogoUrl}`} variant="rounded" />}
                            <Button component="label" variant="outlined">
                                Zmień logo
                                <input type="file" accept="image/png, image/jpeg" hidden onChange={onEditOpponentLogoSelect} />
                            </Button>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onCancelEdit}>Anuluj</Button>
                        <Button type="submit" variant="contained">Zapisz</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    );
}