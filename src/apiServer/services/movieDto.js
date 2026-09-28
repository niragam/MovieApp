// The single shape every movie endpoint returns. Expects `categories` populated with names.
const toMovieDto = movie => ({
    id: movie._id,
    title: movie.title,
    description: movie.description || null,
    categories: (movie.categories || []).filter(Boolean).map(category => category.name ?? category),
    releaseDate: movie.releaseDate || null,
    releaseYear: movie.releaseDate ? new Date(movie.releaseDate).getUTCFullYear() : null,
    duration: movie.duration || null,
    posterUrl: movie.posterUrl || null,
    backdropUrl: movie.backdropUrl || null,
    videoUrl: movie.videoUrl || null,
});

module.exports = { toMovieDto };
