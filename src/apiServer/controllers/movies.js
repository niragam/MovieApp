const mongoose = require('mongoose');
const movieModel = require('../models/movies');
const categoryModel = require('../models/categories');
const userModel = require('../models/users');
const recClient = require('../services/recClient');
const { syncUserHistory, historyIds, removeWatch, flushPendingDeletes } = require('../services/recSync');
const { toMovieDto } = require('../services/movieDto');
const { escapeRegex } = require('../services/validation');

const MAX_ROW_MOVIES = 20;
const CATEGORY_NAMES = { path: 'categories', select: 'name' };

const shuffled = (items) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
};

const resolveCategoryIds = async (names) => {
    const found = await categoryModel.find({ name: { $in: names } }, { name: 1 });
    const missing = names.filter(name => !found.some(category => category.name === name));
    return missing.length ? { missing } : { ids: found.map(category => category._id) };
};

const parseMovieBody = async (body) => {
    const { title, categories, releaseDate, description, duration, posterUrl, backdropUrl, videoUrl } = body;
    if (typeof title !== 'string' || !title.trim()) {
        return { error: [400, 'Title is required'] };
    }
    if (!Array.isArray(categories) || categories.length === 0 || !categories.every(c => typeof c === 'string')) {
        return { error: [400, 'categories must be a non-empty array of category names'] };
    }
    const { ids, missing } = await resolveCategoryIds([...new Set(categories)]);
    if (missing) {
        return { error: [404, `Category not found: ${missing.join(', ')}`] };
    }
    return {
        fields: {
            title,
            categories: ids,
            releaseDate: releaseDate || null,
            description: description || null,
            duration: duration ?? null,
            posterUrl: posterUrl || null,
            backdropUrl: backdropUrl || null,
            videoUrl: videoUrl || null,
        }
    };
};

const createMovie = async (req, res) => {
    const { error, fields } = await parseMovieBody(req.body);
    if (error) {
        return res.status(error[0]).json({ error: error[1] });
    }
    const movie = await movieModel.create(fields);
    res.status(201).location(`/api/movies/${movie._id}`).end();
};

const getMovie = async (req, res) => {
    const movie = await movieModel.findById(req.params.id).populate(CATEGORY_NAMES);
    if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    res.status(200).json(toMovieDto(movie));
};

const getAllMovies = async (req, res) => {
    const movies = await movieModel.find().sort({ title: 1 }).populate(CATEGORY_NAMES);
    res.status(200).json(movies.map(toMovieDto));
};

const updateMovie = async (req, res) => {
    const movie = await movieModel.findById(req.params.id);
    if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    const { error, fields } = await parseMovieBody(req.body);
    if (error) {
        return res.status(error[0]).json({ error: error[1] });
    }
    movie.set(fields);
    await movie.save();
    res.status(204).end();
};

const deleteMovie = async (req, res) => {
    const movieId = req.params.id;
    const movie = await movieModel.findById(movieId);
    if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    const watchers = await userModel.find({ 'watchHistory.movieId': movieId }, { _id: 1 });

    await userModel.updateMany(
        { 'watchHistory.movieId': movieId },
        { $pull: { watchHistory: { movieId } } }
    );
    await movieModel.findByIdAndDelete(movieId);

    for (const watcher of watchers) {
        await removeWatch(watcher._id, movieId);
    }
    res.status(204).end();
};

const returnMovies = async (req, res) => {
    const user = await userModel.findById(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const watchedIds = user.watchHistory.map(entry => entry.movieId);

    const promoted = await categoryModel.find({ promoted: true });
    const result = [];

    for (const category of promoted) {
        const sampled = await movieModel.aggregate([
            { $match: { categories: category._id, _id: { $nin: watchedIds } } },
            { $sample: { size: MAX_ROW_MOVIES } }
        ]);
        if (sampled.length > 0) {
            const movies = await movieModel.populate(sampled, CATEGORY_NAMES);
            result.push({ category: category.name, movies: movies.map(toMovieDto) });
        }
    }

    const recentIds = shuffled(watchedIds.slice(-MAX_ROW_MOVIES));
    const recentMovies = await movieModel.find({ _id: { $in: recentIds } }).populate(CATEGORY_NAMES);
    const byId = new Map(recentMovies.map(movie => [String(movie._id), movie]));
    const history = recentIds.map(id => byId.get(String(id))).filter(Boolean);
    if (history.length > 0) {
        result.push({ category: 'Watch History', movies: history.map(toMovieDto) });
    }

    res.json(result);
};

const watchMovie = async (req, res) => {
    const userId = req.userId;
    const movieId = req.params.id;

    if (!(await movieModel.exists({ _id: movieId }))) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    const movieObjectId = new mongoose.Types.ObjectId(movieId);
    const user = await userModel.findOneAndUpdate(
        { _id: userId },
        [{
            $set: {
                watchHistory: {
                    $concatArrays: [
                        { $filter: { input: '$watchHistory', cond: { $ne: ['$$this.movieId', movieObjectId] } } },
                        [{ movieId: movieObjectId, watchedAt: '$$NOW' }]
                    ]
                }
            }
        }],
        { new: true }
    );
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    try {
        await flushPendingDeletes(userId);
        const reply = await syncUserHistory(userId, historyIds(user));
        if (reply.code !== 204 && reply.code !== 201) {
            console.error(`Recommendation server rejected the update: ${reply.code} ${reply.reason}`);
            return res.status(502).json({ error: 'Recommendation service rejected the update' });
        }
    } catch (error) {
        if (error instanceof recClient.RecServerError) {
            console.error(error.message);
            return res.status(502).json({ error: 'Recommendation service unavailable' });
        }
        throw error;
    }
    res.status(204).end();
};

const recommendMovies = async (req, res) => {
    const userId = req.userId;
    const movieId = req.params.id;

    if (!(await movieModel.exists({ _id: movieId }))) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    const reply = await recClient.send(`GET ${userId} ${movieId}`);
    if (reply.code === 404) {
        return res.status(200).json([]);
    }
    if (reply.code !== 200) {
        console.error(`Recommendation server rejected GET: ${reply.code} ${reply.reason}`);
        return res.status(502).json({ error: 'Recommendation service error' });
    }

    const ids = reply.ids.filter(id => mongoose.isObjectIdOrHexString(id));
    const movies = await movieModel.find({ _id: { $in: ids } }).populate(CATEGORY_NAMES);
    const byId = new Map(movies.map(movie => [String(movie._id), movie]));
    res.status(200).json(ids.map(id => byId.get(id)).filter(Boolean).map(toMovieDto));
};

const searchMovies = async (req, res) => {
    const query = (req.params.query || '').trim();
    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }
    const pattern = new RegExp(escapeRegex(query), 'i');

    const matches = await movieModel.aggregate([
        { $lookup: { from: 'categories', localField: 'categories', foreignField: '_id', as: 'categoryDocs' } },
        {
            $addFields: {
                searchText: [
                    { $toString: '$_id' },
                    '$title',
                    { $ifNull: ['$description', ''] },
                    { $ifNull: ['$posterUrl', ''] },
                    { $ifNull: ['$backdropUrl', ''] },
                    { $ifNull: ['$videoUrl', ''] },
                    { $toString: { $ifNull: ['$duration', ''] } },
                    { $dateToString: { format: '%Y-%m-%d', date: '$releaseDate', onNull: '' } },
                ]
            }
        },
        { $match: { $or: [{ searchText: pattern }, { 'categoryDocs.name': pattern }] } },
        { $project: { _id: 1 } }
    ]);

    const movies = await movieModel.find({ _id: { $in: matches.map(m => m._id) } })
        .sort({ title: 1 })
        .populate(CATEGORY_NAMES);
    res.status(200).json(movies.map(toMovieDto));
};

const rejectEmptySearch = (req, res) => res.status(400).json({ error: 'Search query is required' });

module.exports = {
    createMovie, getMovie, getAllMovies, updateMovie, deleteMovie, returnMovies,
    watchMovie, recommendMovies, searchMovies, rejectEmptySearch
};
