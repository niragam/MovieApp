import { useState, useEffect } from 'react';
import type { Movie } from '../types';

interface HeroPlayerProps {
    movie: Movie | null;
    onPlayClick: (movie: Movie) => void;
    onInfoClick: (movie: Movie) => void;
}

// Generate a consistent gradient based on movie title
const getGradient = (title: string = ''): string => {
    const gradients = [
        'from-red-900 via-red-700 to-orange-600',
        'from-blue-900 via-blue-700 to-purple-600',
        'from-green-900 via-green-700 to-teal-600',
        'from-purple-900 via-purple-700 to-pink-600',
        'from-indigo-900 via-indigo-700 to-blue-600',
    ];

    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = ((hash << 5) - hash) + title.charCodeAt(i);
        hash = hash & hash;
    }

    return gradients[Math.abs(hash) % gradients.length];
};

interface CategoryItem {
    name?: string;
}

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
            {/* Background gradient (simulating video) */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getGradient(movie.title)} transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
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
                        {movie.releaseYear && (
                            <span>{movie.releaseYear}</span>
                        )}
                        {movie.duration && (
                            <span>{movie.duration} min</span>
                        )}
                        {movie.categories && movie.categories.length > 0 && (
                            <span className="flex flex-wrap gap-2">
                                {movie.categories.slice(0, 3).map((cat: string | CategoryItem, i: number) => (
                                    <span key={i} className="bg-white/20 px-2 py-1 rounded">
                                        {typeof cat === 'string' ? cat : cat.name}
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

            {/* Mute button (decorative) */}
            <button className="absolute bottom-8 right-8 md:bottom-16 md:right-16 w-10 h-10 rounded-full border border-white/50 flex items-center justify-center text-white/70 hover:text-white hover:border-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
            </button>
        </div>
    );
};

export default HeroPlayer;
