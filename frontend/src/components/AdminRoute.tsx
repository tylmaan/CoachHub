import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function AdminRoute({ children }: { children: ReactNode }) {
    const { roles } = useAuth();

    if (!roles?.includes("Admin")) {
        return <Navigate to="/" replace />;
    }

    return children;
}