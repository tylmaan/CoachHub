import { Box, Typography } from "@mui/material";
import { MatchNoteField } from "./MatchNoteField";
import { updateGamePlan, updateOpponentNotes } from "../../api/matchesApi";
import type { Match } from "../../types/match";

interface MatchNotesSectionProps {
    match: Match;
    canEditGamePlan: boolean;
    canEditOpponentNotes: boolean;
}

export function MatchNotesSection({ 
    match,
    canEditGamePlan,
    canEditOpponentNotes
}: MatchNotesSectionProps) {
    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Notatki do meczu</Typography>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                <MatchNoteField
                    key={`plan-${match.id}`}
                    title="Plan na mecz"
                    initialText={match.gamePlan}
                    canEdit={canEditGamePlan}
                    save={(text) => updateGamePlan(match.id, text)}
                />
                <MatchNoteField
                    key={`rival-${match.id}`}
                    title="O przeciwniku"
                    initialText={match.opponentNotes}
                    canEdit={canEditOpponentNotes}
                    save={(text) => updateOpponentNotes(match.id, text)}
                />
            </Box>
        </Box>
    );
}