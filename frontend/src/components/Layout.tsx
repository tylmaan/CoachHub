import { AppBar, Toolbar, Typography, Button, Box, Chip } from "@mui/material";
import { Outlet, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
    const { email, roles, logout } = useAuth();

    return (
        <Box>
            <AppBar position="static">
                <Toolbar sx={{ gap: 2 }}>
                    <Typography variant="h6" sx={{ flexGrow: 0 }}>
                        CoachHub
                    </Typography>
                    <Button color="inherit" component={RouterLink} to="/">
                        Dashboard
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/teams">
                        Drużyny
                    </Button>
                    <Button color="inherit" component={RouterLink} to="/players">
                        Zawodnicy
                    </Button>
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="body2">{email}</Typography>
                    {roles?.map((role) => (
                        <Chip key={role} label={role} size="small" color="secondary" />
                    ))}
                    <Button color="inherit" onClick={logout}>
                        Wyloguj się
                    </Button>
                </Toolbar>
            </AppBar>
            <Box sx={{ p: 3 }}>
                <Outlet />
            </Box>
        </Box>
    );
}