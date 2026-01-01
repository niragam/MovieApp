import { useState, useEffect } from 'react';
import { getMovies } from '../services/api';
import TopNav from '../components/TopNav';
import CategoryRow from '../components/CategoryRow';
import MovieDetailsModal from '../components/MovieDetailsModal';
import type { Movie } from '../types';

interface CategoryData {
    category: string;
    movies: Movie[];
}

const BrowsePage = () => {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getMovies() as unknown as CategoryData[];
            setCategories(data);
        } catch (err) {
            setError((err as Error).message || 'Failed to load movies');
        } finally {
            setLoading(false);
        }
    };

    const handleMovieClick = (movie: Movie) => {
        setSelectedMovie(movie);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900">
                <TopNav />
                {/* Category skeletons */}
                <div className="pt-24 pb-8 space-y-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="px-4 md:px-12">
                            <div className="h-8 w-48 skeleton rounded mb-4"></div>
                            <div className="flex gap-3">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="w-44 h-64 skeleton rounded-lg flex-shrink-0"></div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900">
                <TopNav />
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="glass rounded-2xl p-8 max-w-md text-center">
                        <div className="text-6xl mb-4">😞</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
                        <p className="text-gray-400 mb-6">{error}</p>
                        <button onClick={fetchMovies} className="btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <TopNav />

            {/* Category Rows */}
            <div className="pt-24 pb-16">
                {categories.map((category, index) => (
                    <CategoryRow
                        key={category.category || index}
                        title={category.category}
                        movies={category.movies}
                        onMovieClick={handleMovieClick}
                    />
                ))}

                {categories.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-lg">No movies available yet.</p>
                    </div>
                )}
            </div>

            {/* Movie Details Modal */}
            {selectedMovie && (
                <MovieDetailsModal
                    movie={selectedMovie}
                    onClose={() => setSelectedMovie(null)}
                />
            )}
        </div>
    );
};

export default BrowsePage;

