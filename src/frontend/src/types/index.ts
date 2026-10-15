
// ============ USER TYPES ============

export interface User {
    userId: string;
    username: string;
    name: string;
    avatarUrl?: string | null;
    role: 'user' | 'admin';
}

export interface LoginResponse extends User {
    token: string;
}

// ============ MOVIE TYPES ============

export interface Movie {
    id: string;
    title: string;
    description?: string | null;
    categories: string[];
    releaseDate?: string | null;
    releaseYear?: number | null;
    duration?: number | null;
    posterUrl?: string | null;
    backdropUrl?: string | null;
    videoUrl?: string | null;
}

export interface MovieInput {
    title: string;
    categories: string[];
    description?: string;
    duration?: number;
    releaseDate?: string;
    posterUrl?: string;
    backdropUrl?: string;
    videoUrl?: string;
}

export interface HomeRow {
    category: string;
    movies: Movie[];
}

// ============ CATEGORY TYPES ============

export interface Category {
    id: string;
    name: string;
    promoted: boolean;
}

// ============ CONTEXT TYPES ============

export interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
}
