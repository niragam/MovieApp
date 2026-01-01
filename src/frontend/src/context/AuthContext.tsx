import { createContext, useContext, useState, type ReactNode } from 'react';
import type { User, AuthContextType } from '../types';
import { getCurrentUser, getToken, logout as apiLogout } from '../services/api';

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = getToken();
        const storedUser = getCurrentUser();
        return (token && storedUser) ? storedUser : null;
    });
    // We can assume loading is false if checking synchronous storage.
    const [loading] = useState(false);

    // No need for useEffect to set user if we do it lazily.

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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
