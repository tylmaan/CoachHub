import { 
    Box, 
    Card, 
    IconButton, 
    Typography,
    CardActionArea,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { TacticalBoard } from "./TacticalBoard";
import { parseBoardData } from "../../types/tacticalBoard";
import type { TacticalScheme } from "../../types/tacticalScheme";

interface TacticalBoardTileProps {
    scheme: TacticalScheme;
    canDelete: boolean;
    onOpen: (scheme: TacticalScheme) => void;
    onDelete: (scheme: TacticalScheme) => void;
}

export function TacticalBoardTile({ 
    scheme, 
    canDelete, 
    onOpen,
    onDelete 
}: TacticalBoardTileProps) {
    const updated = new Date(scheme.updatedAt).toLocaleString("pl-PL", { day: "numeric", month: "short" });

    return (
        <Card variant="outlined" sx={{ position: "relative" }}>
            <CardActionArea onClick={() => onOpen(scheme)} sx={{ p: 1.5 }}>
                <TacticalBoard data={parseBoardData(scheme.data)} />
                <Box sx={{ mt: 1.5 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>{scheme.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Zaktualizowano: {updated}</Typography>
                </Box>
            </CardActionArea>
            {canDelete && (
                <IconButton
                    size="small"
                    aria-label="Usuń tablicę"
                    onClick={() => onDelete(scheme)}
                    sx={{ position: "absolute", top: 20, right: 20, bgcolor: "background.paper" }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            )}
        </Card>
    );
}