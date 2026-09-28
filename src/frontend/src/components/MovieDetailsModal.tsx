import { useState, useEffect, useRef, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecommendations, getMovie } from '../services/api';
import MovieCard from './MovieCard';
import type { Movie } from '../types';
import { pickGradient } from '../utils/gradient';

interface MovieDetailsModalProps {
    movie: Movie;
    onClose: () => void;
}

const GRADIENTS = [
    'from-red-600 to-orange-500',
    'from-blue-600 to-purple-500',
    'from-green-600 to-teal-500',
    'from-purple-600 to-pink-500',
    'from-indigo-600 to-blue-500',
] as const;

const MovieDetailsModal = ({ movie, onClose }: MovieDetailsModalProps) => {
    const [current, setCurrent] = useState<Movie>(movie);
    const [recs, setRecs] = useState<{ id: string; movies: Movie[] } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);
    const navigate = useNavigate();
    const currentId = current.id;
    const loading = recs?.id !== currentId;
    const recommendations = recs?.id === currentId ? recs.movies : [];

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        let cancelled = false;

        getMovie(currentId)
            .then(full => { if (!cancelled) setCurrent(full); })
            .catch(err => console.error('Failed to load movie details:', err));

        getRecommendations(currentId)
            .then(movies => { if (!cancelled) setRecs({ id: currentId, movies }); })
            .catch(() => { if (!cancelled) setRecs({ id: currentId, movies: [] }); });

        return () => { cancelled = true; };
    }, [currentId]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleWatch = () => {
        navigate(`/watch/${currentId}`);
    };

    const showRecommendation = (rec: Movie) => {
        setCurrent(rec);
        modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

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
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className={`relative h-64 md:h-80 bg-gradient-to-br ${pickGradient(current.title, GRADIENTS)} overflow-hidden`}>
                    {(current.backdropUrl || current.posterUrl) && (
                        <img
                            src={current.backdropUrl || current.posterUrl || ''}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={handleWatch}
                            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-red-900/50"
                            aria-label={`Play ${current.title}`}
                        >
                            <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8">
                    {/* Title and meta */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{current.title}</h2>

                    <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
                        {current.releaseYear ? (
                            <span className="text-green-400 font-semibold">{current.releaseYear}</span>
                        ) : null}
                        {current.duration ? (
                            <span className="text-gray-400">{current.duration} min</span>
                        ) : null}
                        {current.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {current.categories.map(category => (
                                    <span key={category} className="px-2 py-1 bg-white/10 rounded text-gray-300">
                                        {category}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    {current.description && (
                        <p className="text-gray-300 text-lg leading-relaxed mb-8">
                            {current.description}
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-4 mb-8">
                        <button
                            onClick={handleWatch}
                            className="flex items-center gap-2 btn-primary bg-red-600 hover:bg-red-700 border-none text-white px-8 py-3 text-lg"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Watch Now
                        </button>
                    </div>

                    {/* Recommendations */}
                    {loading ? (
                        <div className="flex gap-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-32 h-48 skeleton rounded-lg"></div>
                            ))}
                        </div>
                    ) : recommendations.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">More Like This</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {recommendations.map(rec => (
                                    <div key={rec.id} className="transform scale-90 origin-top-left">
                                        <MovieCard movie={rec} onClick={() => showRecommendation(rec)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MovieDetailsModal;
