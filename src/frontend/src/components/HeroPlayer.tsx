import { useState, useEffect } from 'react';
import type { Movie } from '../types';
import { pickGradient } from '../utils/gradient';

interface HeroPlayerProps {
    movie: Movie | null;
    onPlayClick: (movie: Movie) => void;
    onInfoClick: (movie: Movie) => void;
}

const GRADIENTS = [
    'from-red-900 via-red-700 to-orange-600',
    'from-blue-900 via-blue-700 to-purple-600',
    'from-green-900 via-green-700 to-teal-600',
    'from-purple-900 via-purple-700 to-pink-600',
    'from-indigo-900 via-indigo-700 to-blue-600',
] as const;

const HeroPlayer = ({ movie, onPlayClick, onInfoClick }: HeroPlayerProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Simulate loading
        const timer = setTimeout(() => setIsLoaded(true), 500);
        return () => clearTimeout(timer);
    }, [movie]);

    if (!movie) {
        return (
            <div className="relative h-[70vh] md:h-[85vh] bg-gray-900">
                <div className="absolute inset-0 skeleton"></div>
            </div>
        );
    }

    return (
        <div className="relative h-[70vh] md:h-[85vh] overflow-hidden">
            {/* Backdrop artwork, or a gradient when the movie has none */}
            <div className={`absolute inset-0 bg-gradient-to-br ${pickGradient(movie.title, GRADIENTS)} transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                {movie.backdropUrl && (
                    <img src={movie.backdropUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                )}
                {/* Animated overlay to simulate video movement */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsMjU1LDI1NSwwKSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IGZpbGw9InVybCgjZykiIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIi8+PC9zdmc+')] opacity-30"></div>
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900/80 via-transparent to-transparent"></div>

            {/* Content */}
            <div className={`absolute bottom-0 left-0 right-0 px-4 md:px-12 pb-8 md:pb-16 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                <div className="max-w-2xl">
                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                        {movie.title}
                    </h1>

                    {/* Description */}
                    {movie.description && (
                        <p className="text-lg text-gray-200 mb-6 line-clamp-3 drop-shadow">
                            {movie.description}
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-300">
                        {movie.releaseYear ? <span>{movie.releaseYear}</span> : null}
                        {movie.duration ? <span>{movie.duration} min</span> : null}
                        {movie.categories.length > 0 && (
                            <span className="flex flex-wrap gap-2">
                                {movie.categories.slice(0, 3).map(category => (
                                    <span key={category} className="bg-white/20 px-2 py-1 rounded">
                                        {category}
                                    </span>
                                ))}
                            </span>
                        )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => onPlayClick(movie)}
                            className="flex items-center gap-2 bg-white text-netflix-dark font-semibold px-6 py-3 rounded hover:bg-gray-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                            Play
                        </button>
                        <button
                            onClick={() => onInfoClick(movie)}
                            className="flex items-center gap-2 bg-white/30 backdrop-blur text-white font-semibold px-6 py-3 rounded hover:bg-white/40 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            More Info
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default HeroPlayer;
