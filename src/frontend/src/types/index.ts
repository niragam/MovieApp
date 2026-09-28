// Shapes returned by the API. Component prop types live next to their components.

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

// Fields accepted when creating or replacing a movie (categories by name)
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

// One row of the homepage (GET /api/movies)
export interface HomeRow {
    category: string;
    movies: Movie[];
}

// ============ CATEGORY TYPES ============

export interface Category {
    _id: string;
    name: string;
    isPromoted: boolean;
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
