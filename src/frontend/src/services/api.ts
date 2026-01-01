/* eslint-disable no-undef */
import type { User, LoginResponse, Movie, Category } from '../types';

const API_BASE = '/api';

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

    // Handle non-JSON responses
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

export const register = async (username: string, password: string, name: string): Promise<User> => {
    return apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify({ username, password, name }),
    });
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const data = await apiRequest<LoginResponse>('/users/tokens', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });

    if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            userId: data.userId,
            username: data.username,
            name: data.name,
            role: data.role,
        }));
    }

    return data;
};

export const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const isAdmin = (): boolean => {
    const user = getCurrentUser();
    return user?.role === 'admin';
};

// ============ MOVIES ============

export const getMovies = async (): Promise<Movie[]> => {
    return apiRequest<Movie[]>('/movies');
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
export const createMovie = async (movieData: Partial<Movie>): Promise<Movie> => {
    return apiRequest<Movie>('/movies', {
        method: 'POST',
        body: JSON.stringify(movieData),
    });
};

export const updateMovie = async (id: string, movieData: Partial<Movie>): Promise<Movie> => {
    return apiRequest<Movie>(`/movies/${id}`, {
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

export const getCategory = async (id: string): Promise<Category> => {
    return apiRequest<Category>(`/categories/${id}`);
};

// Admin category operations
export const createCategory = async (name: string, isPromoted: boolean = false): Promise<Category> => {
    return apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, isPromoted }),
    });
};

export const updateCategory = async (id: string, name: string, isPromoted: boolean): Promise<Category> => {
    return apiRequest<Category>(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, isPromoted }),
    });
};

export const deleteCategory = async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/categories/${id}`, {
        method: 'DELETE',
    });
};
