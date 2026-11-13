import { AppBar, Toolbar, Typography, Button, Box, Chip, IconButton } from "@mui/material";
import { Outlet, useLocation, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLE_LABELS } from "../constants/labels";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Logo } from "./Logo";

const PAGE_TITLES: Record<string, string> = {
    "/": "Dashboard",
    "/teams": "Drużyny",
    "/players": "Zawodnicy",
    "/matches": "Mecze",
    "/users": "Użytkownicy",
    "/stats": "Statystyki",
    "/stats/players": "Statystyki zawodników",
    "/reports": "Raporty",
};

function ParentOf(pathname: string): string | null {
    if (pathname === "/") return null;
    if (pathname.startsWith("/matches/")) return "/matches";
    if (pathname.startsWith("/stats/players")) return "/stats";
    if (pathname.startsWith("/reports/")) return "/reports";
    return "/";
}

export function Layout() {
    const { email, roles, logout } = useAuth();
    const location = useLocation();
    const pageTitle = PAGE_TITLES[location.pathname];
    const parentPath = ParentOf(location.pathname);

    return (
        <Box>
            <AppBar position="static">
                <Toolbar sx={{ gap: 2 }}>
                    {parentPath && (
                        <IconButton
                            color="inherit"
                            edge="start"
                            component={RouterLink}
                            to={parentPath}
                            aria-label="Wróć"
                        >
                            <ArrowBackIcon />
                        </IconButton>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography 
                            variant="h6"
                            component={RouterLink}
                            to="/"
                            sx={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 1 }}
                            >
                                <Logo size={28} />
                                CoachHub
                            </Typography>
                        {pageTitle && (
                            <Typography variant="body2" sx={{ opacity: 0.8, pl: 1.5, borderLeft: "1px solid", borderColor: "divider"}}>
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