import { useEffect, useState } from "react";
import axios from "axios";
import { createReport, updateReport } from "../../api/reportsApi";
import { getPlayers } from "../../api/playersApi";
import { getMatches } from "../../api/matchesApi";
import { useAuth } from "../../context/AuthContext";
import type { Report, ReportPriority } from "../../types/report";
import type { Player } from "../../types/player";
import type { Match } from "../../types/match";
import { ReportFormDialogView } from "./ReportFormDialogView";

interface ReportFormDialogProps {
    report: Report | null;
    onClose: () => void;
    onSaved: () => void;
}

export function ReportFormDialog({ report, onClose, onSaved }: ReportFormDialogProps) {
    const { teamId } = useAuth();

    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);

    const [title, setTitle] = useState(report?.title ?? "");
    const [content, setContent] = useState(report?.content ?? "");
    const [priority, setPriority] = useState<ReportPriority>(report?.priority ?? "Normal");
    const [targetType, setTargetType] = useState<"team" | "player">(report?.playerId != null ? "player" : "team");
    const [playerId, setPlayerId] = useState<number | null>(report?.playerId ?? null);
    const [matchId, setMatchId] = useState<number | null>(report?.matchId ?? null);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        getPlayers()
            .then(setPlayers)
            .catch(() => {});
        getMatches()
            .then(setMatches)
            .catch(() => {});
    }, []);

    async function handleSubmit(e: React.SyntheticEvent) {
        e.preventDefault();
        setFormError(null);

        if (targetType === "player" && playerId === null) {
            setFormError("Wybierz zawodnika");
            return;
        }

        const request = {
            title,
            content,
            priority,
            playerId: targetType === "player" ? playerId : null,
            teamId: targetType === "team" ? teamId : null,
            matchId,
        };

        try {
            if (report === null) {
                await createReport(request);
            } else {
                await updateReport(report.id, request);
            }
            onSaved();
        } catch (err) {
            if (axios.isAxiosError(err) && Array.isArray(err.response?.data)) {
                setFormError(err.response.data.join(" "));
            } else {
                setFormError("Nie udało się zapisać raportu.");
            }
        }
    }

    const playerOptions = [...players]
        .filter((p) => p.archivedAt === null || p.id === playerId)
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map((p) => ({ id: p.id, label: `${p.firstName} ${p.lastName}`.trim() }));

    const matchOptions = [...matches]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((m) => ({ id: m.id, label: `${m.date} · ${m.opponent}` }));

    return (
        <ReportFormDialogView
            isEditing={report !== null}
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            priority={priority}
            onPriorityChange={setPriority}
            targetType={targetType}
            onTargetTypeChange={setTargetType}
            playerId={playerId}
            onPlayerIdChange={setPlayerId}
            matchId={matchId}
            onMatchIdChange={setMatchId}
            playerOptions={playerOptions}
            matchOptions={matchOptions}
            formError={formError}
            onSubmit={handleSubmit}
            onClose={onClose}
        />
    );
}