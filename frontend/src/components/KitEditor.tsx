import { Box, MenuItem, TextField, Typography } from "@mui/material";
import { Jersey } from "./Jersey";
import { KIT_PATTERNS, KIT_PATTERN_LABELS } from "../types/kit";
import type { Kit, KitPattern } from "../types/kit";

interface KitEditorProps {
    label: string;
    kit: Kit;
    onChange: (kit: Kit) => void;
    solidOnly?: boolean;
}

export function KitEditor({ label, kit, onChange, solidOnly }: KitEditorProps) {
    const showSecondary = !solidOnly && kit.pattern !== "Solid";

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Jersey kit={kit} number={10} size={64} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
                <Typography variant="subtitle2">{label}</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    {!solidOnly && (
                        <TextField
                            select
                            size="small"
                            label="Wzór"
                            value={kit.pattern}
                            onChange={(e) => onChange({ ...kit, pattern: e.target.value as KitPattern })}
                            sx={{ minWidth: 150 }}
                        >
                            {KIT_PATTERNS.map((p) => (
                                <MenuItem key={p} value={p}>
                                    {KIT_PATTERN_LABELS[p]}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                    <TextField
                        size="small"
                        type="color"
                        label="Kolor 1"
                        value={kit.primaryColor}
                        onChange={(e) => onChange({ ...kit, primaryColor: e.target.value })}
                        sx={{ width: 80 }}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    {showSecondary && (
                        <TextField
                            size="small"
                            type="color"
                            label="Kolor 2"
                            value={kit.secondaryColor}
                            onChange={(e) => onChange({ ...kit, secondaryColor: e.target.value })}
                            sx={{ width: 80 }}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    )}
                </Box>
            </Box>
        </Box>
    )
}