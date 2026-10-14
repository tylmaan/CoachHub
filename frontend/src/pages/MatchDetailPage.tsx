import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, CircularProgress } from "@mui/material";
import { getMatch } from "../api/matchesApi";
import type { Match } from "../types/match";
import { MatchDetailPageView } from "./MatchDetailPageView";

export function MatchDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [match, setMatch] = useState<Match | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        getMatch(Number(id))
            .then(setMatch)
            .catch(() => setError("Nie udało się pobrać meczu."))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <CircularProgress />;
    if (error || !match) return <Alert severity="error">{error ?? "Nie znaleziono meczu."}</Alert>;

    return <MatchDetailPageView match={match} />;
}