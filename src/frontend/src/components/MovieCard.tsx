import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Movie } from '../types';

interface MovieCardProps {
    movie: Movie;
    onClick?: () => void;
}

const PLACEHOLDER_POSTER = 'https://placehold.co/400x600/1a1a1a/e50914?text=Movie+Poster';

const MovieCard = ({ movie, onClick }: MovieCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handlePlayClick = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent triggering the card's onClick
        navigate(`/watch/${movie.id}`);
    };

    return (
        <div
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="movie-card flex-shrink-0 w-40 md:w-48 lg:w-56 cursor-pointer group"
        >
            {/* Card */}
            <div className={`relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 shadow-lg`}>
                {/* Poster Image */}
                <img
                    src={movie.posterUrl || PLACEHOLDER_POSTER}
                    alt={movie.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (img.src !== PLACEHOLDER_POSTER) img.src = PLACEHOLDER_POSTER;
                    }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-20"></div>

                {/* Title overlay (always visible) */}
                <div className="absolute bottom-0 left-0 right-0 p-3 z-30">
                    <h3 className="text-white font-semibold text-sm md:text-base line-clamp-2">
                        {movie.title}
                    </h3>
                </div>

                {/* Hover overlay with play button */}
                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 z-20 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <button
                        onClick={handlePlayClick}
                        className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg shadow-red-900/50"
                        title="Play movie"
                    >
                        <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                </div>

                {/* Duration badge */}
                {movie.duration ? (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs text-white z-30">
                        {movie.duration} min
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default MovieCard;
