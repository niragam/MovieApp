import { useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { AUTH_LOGOUT_EVENT, getCurrentUser, getToken, logout as apiLogout } from '../services/api';
import { AuthContext } from './useAuth';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = getToken();
        const storedUser = getCurrentUser();
        return (token && storedUser) ? storedUser : null;
    });
    const [loading] = useState(false);

    useEffect(() => {
        const handleForcedLogout = () => setUser(null);
        window.addEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
        return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleForcedLogout);
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = () => {
        apiLogout();
        setUser(null);
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isAuthenticated,
            isAdmin,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
