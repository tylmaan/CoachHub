import { Box, Chip, TextField } from "@mui/material";
import { ROLE_FILTERS, ROLE_FILTER_LABELS } from "../../constants/labels";
import type { RoleFilter } from "../../types/userDirectory";

interface UserListFiltersProps {
    query: string;
    onQueryChange: (query: string) => void;
    role: RoleFilter;
    onRoleChange: (role: RoleFilter) => void;
    counts: Record<RoleFilter, number>;
}

export function UserListFilters({ 
    query,
    onQueryChange,
    role,
    onRoleChange,
    counts,
}: UserListFiltersProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
            <TextField
                size="small"
                fullWidth
                placeholder="Szukaj po imieniu lub e-mailu"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
            />
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {ROLE_FILTERS.map((value) => (
                    <Chip
                        key={value}
                        size="small"
                        label={`${ROLE_FILTER_LABELS[value]} · ${counts[value]}`}
                        color={role === value ? "primary" : "default"}
                        variant={role === value ? "filled" : "outlined"}
                        onClick={() => onRoleChange(value)}
                    />
                ))}
            </Box>
        </Box>
    );
}