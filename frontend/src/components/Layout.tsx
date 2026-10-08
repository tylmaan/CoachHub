import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import { Outlet, useLocation, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../constants/labels";

const PAGE_TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/teams": "Drużyny",
    "/players": "Zawodnicy",
    "/matches": "Mecze",
    "/users": "Użytkownicy",
};

export function Layout() {
    const { email, roles, logout } = useAuth();
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname];

    return (
        <Box>
            <AppBar position="static">
                <Toolbar sx={{ gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                        <Typography 
                            variant="h6"
                            component={RouterLink}
                            to="/"
                            sx={{ textDecoration: "none", color: "inherit" }}
                            >
                                CoachHub
                            </Typography>
                        {pageTitle && (
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {pageTitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2">{email}</Typography>
                    {roles?.map((role) => (
                        <Chip key={role} label={ROLE_LABELS[role] ?? role} size="small" color="secondary" />
                    ))}
                    <Button color="inherit" onClick={logout}>
                        Wyloguj się
                    </Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
                <Outlet />
            </Box>
        </Box>
    );
}