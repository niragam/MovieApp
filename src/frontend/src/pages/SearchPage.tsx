import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchMovies } from '../services/api';
import TopNav from '../components/TopNav';
import MovieCard from '../components/MovieCard';
import MovieDetailsModal from '../components/MovieDetailsModal';
import type { Movie } from '../types';

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    // Results are stored with the query they answer; anything else is still loading
    const [fetched, setFetched] = useState<{ query: string; results: Movie[] } | null>(null);
    const loading = !!query && fetched?.query !== query;
    const results = query && fetched?.query === query ? fetched.results : [];
    const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
    const closeModal = useCallback(() => setSelectedMovie(null), []);

    // Only the latest query's results are shown, even if responses arrive out of order
    useEffect(() => {
        if (!query) return;
        let cancelled = false;
        searchMovies(query)
            .then(data => { if (!cancelled) setFetched({ query, results: data }); })
            .catch(err => {
                console.error('Search failed:', err);
                if (!cancelled) setFetched({ query, results: [] });
            });
        return () => { cancelled = true; };
    }, [query]);

    return (
        <div className="min-h-screen bg-gray-900">
            <TopNav />

            <div className="pt-24 px-4 md:px-12 pb-16">
                {/* Search header */}
                <div className="mb-8">
                    {query ? (
                        <h1 className="text-2xl md:text-3xl font-semibold text-white">
                            Search results for: <span className="text-gray-400">"{query}"</span>
                        </h1>
                    ) : (
                        <h1 className="text-2xl md:text-3xl font-semibold text-white">
                            Search for movies
                        </h1>
                    )}
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] skeleton rounded-lg"></div>
                        ))}
                    </div>
                )}

                {/* Results */}
                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {results.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                movie={movie}
                                onClick={() => setSelectedMovie(movie)}
                            />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && query && results.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="glass rounded-2xl p-12 text-center max-w-md">
                            <div className="text-6xl mb-6">🔍</div>
                            <h2 className="text-2xl font-bold text-white mb-3">No results found</h2>
                            <p className="text-gray-400 mb-6">
                                We couldn't find any movies matching "{query}". Try searching for something else.
                            </p>
                            <div className="space-y-2 text-sm text-gray-500">
                                <p>Suggestions:</p>
                                <ul className="list-disc list-inside text-left">
                                    <li>Check your spelling</li>
                                    <li>Try more general keywords</li>
                                    <li>Try searching by genre or category</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* No query state */}
                {!loading && !query && (
                    <div className="flex flex-col items-center justify-center py-24">
                        <div className="glass rounded-2xl p-12 text-center max-w-md">
                            <div className="text-6xl mb-6">🎬</div>
                            <h2 className="text-2xl font-bold text-white mb-3">Start searching</h2>
                            <p className="text-gray-400">
                                Use the search bar above to find movies by title, description, or category.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Movie Details Modal */}
            {selectedMovie && (
                <MovieDetailsModal
                    key={selectedMovie.id}
                    movie={selectedMovie}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default SearchPage;
