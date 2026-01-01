import React from 'react';

// ============ USER TYPES ============

export interface User {
    userId: string;
    username: string;
    name: string;
    role: 'user' | 'admin';
}

export interface LoginResponse {
    token: string;
    userId: string;
    username: string;
    name: string;
    role: 'user' | 'admin';
}

// ============ MOVIE TYPES ============

export interface Movie {
    _id: string;
    id?: string; // Support for alternate ID field if present
    title: string;
    description?: string;
    duration?: number;
    releaseYear?: number;
    categories?: string[];
    videoUrl?: string;
}

// ============ CATEGORY TYPES ============

export interface Category {
    _id: string;
    name: string;
    isPromoted: boolean;
    movies: Movie[];
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

// ============ COMPONENT PROPS ============

export interface ChildrenProps {
    children: React.ReactNode;
}

export interface MovieCardProps {
    movie: Movie;
    onClick?: () => void;
}

export interface CategoryRowProps {
    category: Category;
    onMovieClick: (movie: Movie) => void;
}

export interface HeroPlayerProps {
    movie: Movie | null;
    onPlay: (movie: Movie) => void;
    onMoreInfo: (movie: Movie) => void;
}

export interface MovieDetailsModalProps {
    movie: Movie | null;
    isOpen: boolean;
    onClose: () => void;
    onPlay: (movie: Movie) => void;
}

export interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

// ============ API TYPES ============

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    success?: boolean;
}
