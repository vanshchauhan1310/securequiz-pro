import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Allow both admin and faculty for "admin" routes (dashboard, etc.)
    if (requireAdmin && user?.role !== 'admin' && user?.role !== 'faculty') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
