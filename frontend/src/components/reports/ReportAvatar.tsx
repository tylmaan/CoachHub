import { Avatar } from "@mui/material";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { BACKEND_ORIGIN } from "../../api/axiosInstance";
import type { Report } from "../../types/report";

interface ReportAvatarProps {
    report: Pick<Report, "playerName" | "playerPhotoUrl" | "teamLogoUrl">;
    size?: number;
}

function initials(name: string) {
    const parts = name.split(" ").filter(Boolean);
    return parts.length === 0 ? "" : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ReportAvatar({ report, size = 44 }: ReportAvatarProps) {
    if (report.playerName !== null) {
        return (
            <Avatar
                src={report.playerPhotoUrl ? `${BACKEND_ORIGIN}${report.playerPhotoUrl}` : undefined}
                sx={{ width: size, height: size }}
            >
                {initials(report.playerName)}
            </Avatar>
        );
    }
    return (
        <Avatar
            variant="rounded"
            src={report.teamLogoUrl ? `${BACKEND_ORIGIN}${report.teamLogoUrl}` : undefined}
            sx={{ width: size, height: size }}
        >
            <ShieldOutlinedIcon />
        </Avatar>
    );
}