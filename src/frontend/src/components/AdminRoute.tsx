import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import type { ReactNode } from 'react';

interface AdminRouteProps {
    children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="glass rounded-2xl p-8 max-w-md text-center animate-fadeIn">
                    <div className="text-6xl mb-4">🚫</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
                    <a href="/browse" className="btn-primary inline-block">
                        Go to Browse
                    </a>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default AdminRoute;
