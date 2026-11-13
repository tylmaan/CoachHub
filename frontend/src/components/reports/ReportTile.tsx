import { Box, Card, CardActionArea, Chip, Typography } from "@mui/material";
import type { Report } from "../../types/report";
import { REPORT_PRIORITY_LABELS, reportSubject } from "../../types/report";
import { ReportAvatar } from "./ReportAvatar";

interface ReportTileProps {
    report: Report;
    onOpen: (id: number) => void;
}

export function ReportTile({ report, onOpen }: ReportTileProps) {
    const date = new Date(report.createdAt).toLocaleDateString("pl-PL", { day: "numeric", month: "short" });

    return (
        <Card variant="outlined" sx={{ position: "relative" }}>
            <CardActionArea
                onClick={() => onOpen(report.id)}
                sx={{ p: 1.5, display: "flex", alignItems: "flex-start", gap: 1.5 }}
            >
                <ReportAvatar report={report} />
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontWeight: report.isRead ? 400 : 600 }}>
                        {reportSubject(report)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                        {report.title}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" noWrap>
                            {report.authorName} · {date}
                        </Typography>
                        {report.priority === "High" && (
                            <Chip size="small" color="error" label={REPORT_PRIORITY_LABELS.High} />
                        )}
                        {report.priority === "Low" && (
                            <Chip size="small" variant="outlined" label={REPORT_PRIORITY_LABELS.Low} />
                        )}
                    </Box>
                </Box>
            </CardActionArea>
            {!report.isRead && (
                <Box
                    sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "primary.light",
                    }}
                />
            )}
        </Card>
    );
}