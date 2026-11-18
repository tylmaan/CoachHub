import { Box } from "@mui/material";
import type { ReactNode } from "react";

interface PitchProps {
    aspectRatio?: string;
    children?: ReactNode;
}

export function Pitch({ aspectRatio = "7 / 5", children }: PitchProps) {
    return (
        <Box
            sx={{
                position: "relative",
                width: "100%",
                aspectRatio,
                borderRadius: 2,
                border: "0.5px solid rgba(255,255,255,0.2)",
                overflow: "hidden",
                background: "repeating-linear-gradient(0deg, rgba(99,153,34,0.18) 0 10%, rgba(99,153,34,0.08) 10% 20%), #3b6d11",
            }}
        >
            <Box sx={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", bgcolor: "rgba(255,255,255,0.5)" }} />
            <Box sx={{ position: "absolute", left: "50%", top: "50%", width: "15%", aspectRatio: "1 / 1", border: "1px solid rgba(255,255,255,0.5)", borderRadius: "50%", transform: "translate(-50%,-50%)" }} />
            <Box sx={{ position: "absolute", inset: "3%", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 1 }} />
            {children}
        </Box>
    );
}