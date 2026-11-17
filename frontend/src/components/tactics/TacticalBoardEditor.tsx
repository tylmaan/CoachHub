import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { TacticalBoard } from "./TacticalBoard";
import { useHistory } from "../../hooks/useHistory";
import { parseBoardData, type TacticalBoardData } from "../../types/tacticalBoard";
import type { TacticalScheme } from "../../types/tacticalScheme";

interface TacticalBoardEditorProps {
    scheme: TacticalScheme;
    onClose: () => void;
}

export function TacticalBoardEditor({ 
    scheme, 
    onClose
}: TacticalBoardEditorProps) {
    const { present } = useHistory<TacticalBoardData>(parseBoardData(scheme.data));
    
    return (
        <Dialog open onClose={onClose} fullWidth maxWidth="lg">
            <DialogTitle>{scheme.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ width: "min(100%, calc((100vh - 240px) * 68 / 105))", mx: "auto" }}>
                    <TacticalBoard data={present} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Zamknij</Button>
            </DialogActions>
        </Dialog>
    );
}