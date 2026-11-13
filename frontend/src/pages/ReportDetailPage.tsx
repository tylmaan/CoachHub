import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, CircularProgress } from "@mui/material";
import { deleteReport, getReport, markReportAsRead } from "../api/reportsApi";
import { useAuth } from "../context/AuthContext";
import { ConfirmDeleteDialog } from "../components/ConfirmDeleteDialog";
import { ReportFormDialog } from "../components/reports/ReportFormDialog";
import type { Report } from "../types/report";
import { ReportDetailPageView } from "./ReportDetailPageView";

export function ReportDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { roles } = useAuth();
    const canDelete = !!roles?.includes("Coach");

    const [report, setReport] = useState<Report | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [reloadKey, setReloadKey] = useState(0);
    const [formOpen, setFormOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getReport(Number(id))
            .then((result) => {
                if (cancelled) return;
                setReport(result);
                if (!result.isRead) markReportAsRead(result.id).catch(() => {})
            })
            .catch(() => {
                if (!cancelled) setError("Nie udało się pobrać raportu.");
            });
        return () => {
            cancelled = true;
        };
    }, [id, reloadKey]);

    function handleSaved() {
        setFormOpen(false);
        setReloadKey(reloadKey + 1);
    }

    async function confirmDelete() {
        setActionError(null);
        try {
            await deleteReport(Number(id));
            navigate("/reports");
        } catch {
            setActionError("Nie udało się usunąć raportu.");
            setDeleteOpen(false);
        }
    }

    if (report === null) {
        return error ? <Alert severity="error">{error}</Alert> : <CircularProgress />;
    }

    return (
        <>
            <ReportDetailPageView
                report={report}
                canDelete={canDelete}
                actionError={actionError}
                onEdit={() => setFormOpen(true)}
                onDelete={() => setDeleteOpen(true)}
            />
            {formOpen && (
                <ReportFormDialog report={report} onClose={() => setFormOpen(false)} onSaved={handleSaved} />
            )}
            <ConfirmDeleteDialog
                open={deleteOpen}
                title="Usunąć raport?"
                message="Raport zostanie trwale usunięty. Tej operacji nie można cofnąć."
                onConfirm={confirmDelete}
                onCancel={() => setDeleteOpen(false)}
            />
        </>
    );
}