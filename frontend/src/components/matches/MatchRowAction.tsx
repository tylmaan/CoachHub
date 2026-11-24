import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, IconButton, Menu, MenuItem } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import type { Match } from "../../types/match";

interface MatchRowActionProps {
    match: Match;
    canEdit: boolean;
    canDelete: boolean;
    onFinish: (id: number) => void;
    onEdit: (match: Match) => void;
    onDelete: (id: number) => void;
}

export function MatchRowAction({ 
    match, 
    canEdit, 
    canDelete,
    onFinish,
    onEdit,
    onDelete
}: MatchRowActionProps) {
    const [anchor, setAnchor] = useState<HTMLElement | null>(null);
    const canFinish = match.status === "Planned" && canEdit;

    function run(action: () => void) {
        setAnchor(null);
        action();
    }

    return (
        <>
            <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1, flexShrink: 0 }}>
                <Button size="small" component={RouterLink} to={`/matches/${match.id}`}>Szczegóły</Button>
                {canFinish && <Button size="small" onClick={() => onFinish(match.id)}>Zakończ mecz</Button>}
                {canEdit && <Button size="small" onClick={() => onEdit(match)}>Edytuj</Button>}
                {canDelete && <Button size="small" color="error" onClick={() => onDelete(match.id)}>Usuń</Button>}
            </Box>

            <IconButton
                aria-label="Akcje meczu"
                onClick={(e) => setAnchor(e.currentTarget)}
                sx={{ display: { xs: "inline-flex", sm: "none" }, position: "absolute", top: 8, right: 8 }}
            >
                <MoreVertIcon />
            </IconButton>
            <Menu anchorEl={anchor} open={anchor !== null} onClose={() => setAnchor(null)}>
                <MenuItem component={RouterLink} to={`/matches/${match.id}`}>Szczegóły</MenuItem>
                {canFinish && <MenuItem onClick={() => run(() => onFinish(match.id))}>Zakończ mecz</MenuItem>}
                {canEdit && <MenuItem onClick={() => run(() => onEdit(match))}>Edytuj</MenuItem>}
                {canDelete && (
                    <MenuItem onClick={() => run(() => onDelete(match.id))} sx={{ color: "error.main" }}>
                        Usuń
                    </MenuItem>
                )}
            </Menu>
        </>
    );
}