import { createContext, useContext, useState, type ReactNode } from 'react';
import type { AuthResponse } from '../types/auth';

interface AuthContextType {
    token: string | null;
    email: string | null;
    roles: string[] | null;
    teamId: number | null;
    login: (auth: AuthResponse) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
    const [email, setEmail] = useState<string | null>(localStorage.getItem("email"));
    const [roles, setRoles] = useState<string[]> (
        JSON.parse(localStorage.getItem("roles") || "[]")
    );
    const [teamId, setTeamId] = useState<number | null>(
        JSON.parse(localStorage.getItem("teamId") || "null")
    );
    
    function login(auth: AuthResponse) {
        localStorage.setItem("token", auth.token);
        localStorage.setItem("email", auth.email);
        localStorage.setItem("roles", JSON.stringify(auth.roles));
        localStorage.setItem("teamId", JSON.stringify(auth.teamId));
        setToken(auth.token);
        setEmail(auth.email);
        setRoles(auth.roles);
        setTeamId(auth.teamId);
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("roles");
        localStorage.removeItem("teamId");
        setToken(null);
        setEmail(null);
        setRoles([]);
        setTeamId(null);
    }

    return (
        <AuthContext.Provider value={{ token, email, roles, teamId, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}