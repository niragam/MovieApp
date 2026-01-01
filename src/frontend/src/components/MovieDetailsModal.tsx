import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations, watchMovie, getMovie } from '../services/api';
import MovieCard from './MovieCard';
import type { Movie } from '../types';

interface MovieDetailsModalProps {
    movie: Movie | null;
    onClose: () => void;
}

interface RecommendationsResponse {
    'Recommended Movies'?: string;
}

interface CategoryItem {
    name?: string;
}

// Generate gradient based on title
const getGradient = (title: string = ''): string => {
    const gradients = [
        'from-red-600 to-orange-500',
        'from-blue-600 to-purple-500',
        'from-green-600 to-teal-500',
        'from-purple-600 to-pink-500',
        'from-indigo-600 to-blue-500',
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
        hash = hash & hash;
    }

    return gradients[Math.abs(hash) % gradients.length];
};

const MovieDetailsModal = ({ movie, onClose }: MovieDetailsModalProps) => {
    const [recommendations, setRecommendations] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const [watchLoading, setWatchLoading] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const getMovieId = (m: Movie | null): string | undefined => {
        if (!m) return undefined;
        return m._id || m.id;
    };

    useEffect(() => {
        // Fetch recommendations
        const fetchRecommendations = async () => {
            const movieId = getMovieId(movie);
            if (!movieId) return;
            setLoading(true);
            try {
                const data = await getRecommendations(movieId) as unknown as RecommendationsResponse;
                // Parse recommendations (they come as a string)
                if (data['Recommended Movies']) {
                    const recIds = data['Recommended Movies'].split(' ').filter(Boolean);
                    // Fetch full movie details for each ID
                    const moviePromises = recIds.map(id => getMovie(id));
                    const movies = await Promise.all(moviePromises);
                    setRecommendations(movies);
                }
            } catch {
                console.log('No recommendations available');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();

        // Close on escape
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [movie, onClose]);

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleWatch = async () => {
        const movieId = getMovieId(movie);
        if (!movieId) return;

        setWatchLoading(true);
        try {
            // Attempt to track the watch, but don't block navigation if it fails
            watchMovie(movieId).catch(err => console.error('Failed to track movie watch:', err));
            navigate(`/watch/${movieId}`);
        } catch (err) {
            console.error('Failed to navigate:', err);
        } finally {
            setWatchLoading(false);
        }
    };

    if (!movie) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto glass rounded-2xl animate-slideUp"
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Hero image with video preview */}
                <div className={`relative h-64 md:h-80 bg-gradient-to-br ${getGradient(movie.title)} overflow-hidden`}>
                    {/* Placeholder video preview */}
                    <video
                        className="absolute inset-0 w-full h-full object-cover"
                        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                        autoPlay
                        muted
                        loop
                        playsInline
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={handleWatch}
                            disabled={watchLoading}
                            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 shadow-lg shadow-red-900/50"
                        >
                            {watchLoading ? (
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Title and meta */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{movie.title}</h2>

                    <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
                        {movie.releaseYear && (
                            <span className="text-green-400 font-semibold">
                                {movie.releaseYear}
                            </span>
                        )}
                        {movie.duration && (
                            <span className="text-gray-400">{movie.duration} min</span>
                        )}
                        {movie.categories && (
                            <div className="flex flex-wrap gap-2">
                                {(Array.isArray(movie.categories) ? movie.categories : []).map((cat: string | CategoryItem, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-gray-300">
                                        {typeof cat === 'string' ? cat : cat.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {movie.description && (
                        <p className="text-gray-300 text-lg leading-relaxed mb-8">
                            {movie.description}
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={handleWatch}
                            disabled={watchLoading}
                            className="flex items-center gap-2 btn-primary bg-red-600 hover:bg-red-700 border-none text-white px-8 py-3 text-lg"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Watch Now
                        </button>
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">More Like This</h3>
                            {loading ? (
                                <div className="flex gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-32 h-48 skeleton rounded-lg"></div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {recommendations.map((recMovie) => (
                                        <div key={recMovie._id || recMovie.id} className="transform scale-90 origin-top-left">
                                            <MovieCard movie={recMovie} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default MovieDetailsModal;
