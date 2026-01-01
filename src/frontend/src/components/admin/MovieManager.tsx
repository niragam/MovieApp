import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { getCategories, getMovies, createMovie, updateMovie, deleteMovie } from '../../services/api';
import ConfirmDialog from '../ConfirmDialog';
import type { Category, Movie } from '../../types';

interface MovieWithCategory extends Movie {
    id?: string;
    categoryName?: string;
    releaseDate?: string;
}

interface FormData {
    title: string;
    description: string;
    duration: string;
    releaseDate: string;
    categories: string[];
}

interface DeleteConfirmState {
    isOpen: boolean;
    id: string | null;
    title: string;
}

interface CategoryWithMovies {
    category: string;
    movies: MovieWithCategory[];
}

const MovieManager = () => {
    const [movies, setMovies] = useState<MovieWithCategory[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingMovie, setEditingMovie] = useState<MovieWithCategory | null>(null);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        duration: '',
        releaseDate: '',
        categories: [],
    });
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({ isOpen: false, id: null, title: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [moviesData, categoriesData] = await Promise.all([
                getMovies(),
                getCategories(),
            ]);
            // Flatten movies from categories
            const allMovies = (moviesData as unknown as CategoryWithMovies[]).flatMap(cat =>
                (cat.movies || []).map(m => ({ ...m, categoryName: cat.category }))
            );
            setMovies(allMovies);
            setCategories(categoriesData);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            duration: '',
            releaseDate: '',
            categories: [],
        });
        setEditingMovie(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.title.trim() || formData.categories.length === 0) {
            setError('Title and at least one category are required');
            return;
        }

        setActionLoading(true);
        try {
            const movieData = {
                title: formData.title,
                categories: formData.categories,
                description: formData.description || undefined,
                duration: formData.duration ? parseInt(formData.duration) : undefined,
                releaseDate: formData.releaseDate || undefined,
            };

            if (editingMovie?.id) {
                await updateMovie(editingMovie.id, movieData);
            } else {
                await createMovie(movieData);
            }
            resetForm();
            fetchData();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (movie: MovieWithCategory) => {
        setEditingMovie(movie);
        setFormData({
            title: movie.title,
            description: movie.description || '',
            duration: movie.duration?.toString() || '',
            releaseDate: movie.releaseDate ? movie.releaseDate.split('T')[0] : '',
            categories: movie.categories || [],
        });
        setShowForm(true);
    };

    const handleDeleteClick = (movie: MovieWithCategory) => {
        setDeleteConfirm({ isOpen: true, id: movie.id || movie._id, title: movie.title });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteConfirm.id) return;
        setActionLoading(true);
        try {
            await deleteMovie(deleteConfirm.id);
            setDeleteConfirm({ isOpen: false, id: null, title: '' });
            fetchData();
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setActionLoading(false);
        }
    };

    const toggleCategory = (categoryName: string) => {
        setFormData(prev => ({
            ...prev,
            categories: prev.categories.includes(categoryName)
                ? prev.categories.filter(c => c !== categoryName)
                : [...prev.categories, categoryName],
        }));
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 skeleton rounded-lg"></div>
                ))}
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Movies</h2>
                <button
                    onClick={() => {
                        resetForm();
                        setShowForm(!showForm);
                    }}
                    className="btn-primary flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Movie
                </button>
            </div>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-6">
                    <p className="text-red-400">{error}</p>
                    <button onClick={() => setError(null)} className="text-red-300 hover:text-white text-sm mt-1">
                        Dismiss
                    </button>
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="glass rounded-lg p-6 mb-6 animate-slideUp">
                    <h3 className="text-lg font-semibold text-white mb-4">
                        {editingMovie ? 'Edit Movie' : 'Add New Movie'}
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
                                className="input-field"
                                placeholder="Movie title"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                value={formData.duration}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, duration: e.target.value })}
                                className="input-field"
                                placeholder="120"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                            className="input-field min-h-[100px]"
                            placeholder="Movie description..."
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Release Date</label>
                            <input
                                type="date"
                                value={formData.releaseDate}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, releaseDate: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Categories *</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat._id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.name)}
                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${formData.categories.includes(cat.name)
                                            ? 'bg-netflix-red text-white'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                            }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" disabled={actionLoading} className="btn-primary">
                            {actionLoading ? 'Saving...' : editingMovie ? 'Update Movie' : 'Add Movie'}
                        </button>
                        <button type="button" onClick={resetForm} className="btn-ghost">
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Movies Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {movies.map((movie) => (
                    <div key={movie.id || movie._id} className="glass rounded-lg p-4 hover:bg-white/5 transition-colors">
                        <h3 className="text-lg font-semibold text-white mb-2">{movie.title}</h3>

                        {movie.description && (
                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{movie.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4 text-xs">
                            {movie.duration && (
                                <span className="bg-white/10 px-2 py-1 rounded text-gray-300">
                                    {movie.duration} min
                                </span>
                            )}
                            {movie.releaseDate && (
                                <span className="bg-white/10 px-2 py-1 rounded text-gray-300">
                                    {new Date(movie.releaseDate).getFullYear()}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleEdit(movie)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                            >
                                Edit
                            </button>
                            <button
                                onClick={() => handleDeleteClick(movie)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-sm rounded transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {movies.length === 0 && (
                <div className="glass rounded-lg p-8 text-center text-gray-400">
                    No movies yet. Add your first movie above.
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Movie"
                message={`Are you sure you want to delete "${deleteConfirm.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
                isLoading={actionLoading}
            />
        </div>
    );
};

export default MovieManager;
