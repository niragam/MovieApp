/* eslint-disable no-undef */
import type { User, LoginResponse, Movie, MovieInput, Category, HomeRow } from '../types';

const API_BASE = '/api';

export const AUTH_LOGOUT_EVENT = 'auth:logout';

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Helper for API requests
const apiRequest = async <T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
        },
    });

    if (response.status === 401 && endpoint !== '/tokens') {
        logout();
        window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }
        return { success: true } as T;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
};

// ============ AUTH ============

export const register = async (username: string, password: string, name: string, avatarUrl?: string): Promise<User> => {
    return apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, name, avatarUrl: avatarUrl || undefined }),
    });
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const data = await apiRequest<LoginResponse>('/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (data.token) {
        localStorage.setItem('token', data.token);
        const user: User = {
            userId: data.userId,
            username: data.username,
            name: data.name,
            avatarUrl: data.avatarUrl ?? null,
            role: data.role,
        };
        localStorage.setItem('user', JSON.stringify(user));
    }

    return data;
};

export const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
    try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// ============ MOVIES ============

export const getMovies = async (): Promise<HomeRow[]> => {
    return apiRequest<HomeRow[]>('/movies');
};

export const getAllMovies = async (): Promise<Movie[]> => {
    return apiRequest<Movie[]>('/movies/all');
};

export const getMovie = async (id: string): Promise<Movie> => {
    return apiRequest<Movie>(`/movies/${id}`);
};

export const searchMovies = async (query: string): Promise<Movie[]> => {
    return apiRequest<Movie[]>(`/movies/search/${encodeURIComponent(query)}`);
};

export const watchMovie = async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/movies/${id}/recommend`, {
        method: 'POST',
    });
};

export const getRecommendations = async (id: string): Promise<Movie[]> => {
    return apiRequest<Movie[]>(`/movies/${id}/recommend`);
};

// Admin movie operations
export const createMovie = async (movieData: MovieInput): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('/movies', {
        method: 'POST',
        body: JSON.stringify(movieData),
    });
};

export const updateMovie = async (id: string, movieData: MovieInput): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/movies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(movieData),
    });
};

export const deleteMovie = async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/movies/${id}`, {
        method: 'DELETE',
    });
};

// ============ CATEGORIES ============

export const getCategories = async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories');
};

// Admin category operations
export const createCategory = async (name: string, promoted: boolean = false): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, promoted }),
    });
};

export const updateCategory = async (id: string, name: string, promoted: boolean): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, promoted }),
    });
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/categories/${id}`, {
        method: 'DELETE',
    });
};
