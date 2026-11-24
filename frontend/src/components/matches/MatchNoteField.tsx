import { useState } from "react";
import { useAutosave } from "../../hooks/useAutosave";
import { 
    Box,
    Button,
    TextField,
    Typography 
} from "@mui/material";
import { SAVE_STATUS_LABELS } from "../../constants/tacticalBoard";

const MAX_LENGTH = 4000;

interface MatchNoteFieldProps {
    title: string;
    initialText: string | null;
    canEdit: boolean;
    save: (text: string | null) => Promise<void>;
}

export function MatchNoteField({ 
    title, 
    initialText, 
    canEdit,
    save
}: MatchNoteFieldProps) {
    const [text, setText] = useState(initialText ?? "");
    const { status, retry } = useAutosave(text, save, canEdit);

    return (
        <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>

            {canEdit ? (
                <>
                    <TextField
                        multiline
                        fullWidth
                        minRows={5}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        slotProps={{ htmlInput: { maxLength: MAX_LENGTH } }}
                    />
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, minHeight: 32 }}>
                        <Typography variant="caption" color={status === "error" ? "error" : "text.secondary"}>
                            {SAVE_STATUS_LABELS[status]}
                        </Typography>
                        {status === "error" && <Button size="small" onClick={retry}>Ponów</Button>}
                    </Box>
                </>
            ) : (
                <Typography
                    color={initialText ? "text.primary" : "text.secondary"}
                    sx={{ whiteSpace: "pre-wrap" }}
                >
                    {initialText || "Brak notatek"}
                </Typography>
            )}
        </Box>
    );
}