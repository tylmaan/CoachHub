import { useState } from "react";
import {
    Avatar,
    Box,
    Chip,
    List,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { BACKEND_ORIGIN } from "../../api/axiosInstance";
import { ROLE_CHIP_COLORS, ROLE_LABELS } from "../../constants/labels";
import { userInitials, userLabel } from "../../types/userDirectory";
import type { UserGroup } from "../../types/userDirectory";
import type { UserSummary } from "../../types/user";

interface UserListProps {
    groups: UserGroup[];
    selectedId: string | null;
    onSelect: (user: UserSummary) => void;
}

export function UserList({ 
    groups,
    selectedId,
    onSelect,
}: UserListProps) {
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    function toggle(key: string) {
        setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    if (groups.length === 0) {
        return ( 
            <Typography color="text.secondary">
                Brak użytkowników spełniających kryteria.
            </Typography>
        );
    }

    return (
        <Paper variant="outlined">
            <List disablePadding>
                {groups.map((group) => {
                    const key = String(group.teamId);
                    const isCollapsed = !!collapsed[key];
                    return (
                        <Box key={key}>
                            <ListItemButton onClick={() => toggle(key)} divider sx={{ bgcolor: "action.hover", py: 0.75 }}>
                                {isCollapsed ? <ChevronRightIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                                <Typography variant="subtitle2" sx={{ ml: 1 }}>{group.teamName}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                                    {group.users.length}
                                </Typography>
                            </ListItemButton>

                            {!isCollapsed && group.users.map((user) => (
                                <ListItemButton
                                    key={user.id}
                                    divider
                                    selected={user.id === selectedId}
                                    onClick={() => onSelect(user)}
                                >
                                    <ListItemAvatar sx={{ minWidth: 44 }}>
                                        <Avatar
                                            src={user.photoUrl ? `${BACKEND_ORIGIN}${user.photoUrl}` : undefined}
                                            sx={{ width: 32, height: 32, fontSize: 13 }}
                                        >
                                            {userInitials(user)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={userLabel(user)}
                                        secondary={user.fullName ? user.email : undefined}
                                        slotProps={{ primary: { noWrap: true, variant: "body2" }, secondary: { noWrap: true } }}
                                    />
                                    <Chip
                                        size="small"
                                        color={ROLE_CHIP_COLORS[user.roles[0]] ?? "default"}
                                        label={ROLE_LABELS[user.roles[0]] ?? user.roles[0]}
                                        sx={{ ml: 1, flexShrink: 0 }}
                                    />
                                </ListItemButton>
                            ))}
                        </Box>
                    );
                })}
            </List>
        </Paper>
    );
}