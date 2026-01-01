import { useState, useRef, useEffect } from 'react';
import MovieCard from './MovieCard';
import type { Movie } from '../types';

interface CategoryRowProps {
    title: string;
    movies: Movie[];
    onMovieClick: (movie: Movie) => void;
}

const CategoryRow = ({ title, movies, onMovieClick }: CategoryRowProps) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (rowRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [movies]);

    const scroll = (direction: 'left' | 'right') => {
        if (rowRef.current) {
            const scrollAmount = rowRef.current.clientWidth * 0.8;
            rowRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className="mb-8 group">
            {/* Category Title */}
            <h2 className="text-xl md:text-2xl font-semibold text-white mb-4 px-4 md:px-12">
                {title}
            </h2>

            {/* Row Container */}
            <div className="relative">
                {/* Left Arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-r from-gray-900 to-transparent flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Movies Row */}
                <div
                    ref={rowRef}
                    onScroll={checkScroll}
                    className="flex overflow-x-auto hide-scrollbar gap-3 md:gap-4 px-4 md:px-12 scroll-smooth"
                >
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie._id}
                            movie={movie}
                            onClick={() => onMovieClick(movie)}
                        />
                    ))}
                </div>

                {/* Right Arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-0 bottom-0 z-10 w-12 md:w-16 bg-gradient-to-l from-gray-900 to-transparent flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
                    >
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CategoryRow;
