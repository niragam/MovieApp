import { createContext, useContext } from 'react';
import type { AuthContextType } from '../types';

// Kept out of AuthContext.tsx so that file only exports components (fast refresh)
export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
