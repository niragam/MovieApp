const mongoose = require('mongoose');
const movieModel = require('../models/movies');
const categoryModel = require('../models/categories');
const userModel = require('../models/users');
const recClient = require('../services/recClient');

const createMovie = async (req, res) => {
    try {
        const { title, categories, releaseDate, description, duration } = req.body;

        if (!title || !categories || categories.length === 0) {
            return res.status(400).json({ error: 'Title and at least one category are required' });
        }

        const categoryIds = [];
        for (const categoryName of categories) {
            const existingCategory = await categoryModel.findOne({ name: categoryName });
            if (!existingCategory) {
                return res.status(404).json({ error: `Category ${categoryName} not found` });
            }
            categoryIds.push(existingCategory._id);
        }

        const newMovie = new movieModel({ title, categories: categoryIds, releaseDate, description, duration });
        await newMovie.save();

        res.status(201)
            .location(`/api/movies/${newMovie._id}`)
            .end();

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getMovie = async (req, res) => {
    try {
        const movieId = req.params.id;

        // Check if the movieId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const movie = await movieModel.findById(movieId).populate('categories', 'name');
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        res.status(200).json({
            id: movie._id,
            title: movie.title,
            categories: movie.categories.map(category => category.name),
            releaseDate: movie.releaseDate,
            description: movie.description,
            duration: movie.duration
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const updateMovie = async (req, res) => {
    try {
        const movieId = req.params.id;

        // Check if the movieId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const { title, categories, releaseDate, description, duration } = req.body;

        if (!title || !categories || categories.length === 0) {
            return res.status(400).json({ error: 'Title and at least one category are required' });
        }

        const movie = await movieModel.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const categoryIds = [];
        for (const categoryName of categories) {
            const existingCategory = await categoryModel.findOne({ name: categoryName });
            if (!existingCategory) {
                return res.status(404).json({ error: `Category ${categoryName} not found` });
            }
            categoryIds.push(existingCategory._id);
        }

        movie.title = title;
        movie.categories = categoryIds;
        movie.releaseDate = releaseDate || null;
        movie.description = description || null;
        movie.duration = duration || null;

        await movie.save();

        res.status(204).end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const deleteMovie = async (req, res) => {
    try {
        const movieId = req.params.id;

        // Check if the movieId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const movie = await movieModel.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        // Only users who watched the movie need their recommendation data updated
        const watchers = await userModel.find({ 'watchHistory.movieId': movieId }, { _id: 1 });

        await userModel.updateMany(
            { 'watchHistory.movieId': movieId },
            { $pull: { watchHistory: { movieId } } }
        );
        await movieModel.findByIdAndDelete(movieId);

        // MongoDB is the source of truth; if the recommendation server is unreachable,
        // the startup resync (services/recSync.js) repairs it later.
        for (const watcher of watchers) {
            try {
                await recClient.send(`DELETE ${watcher._id} ${movieId}`);
            } catch (error) {
                console.error(`Could not remove movie ${movieId} for user ${watcher._id}:`, error.message);
            }
        }
        res.status(204).end();

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const MAX_ROW_MOVIES = 20;

const formatHomeMovie = movie => ({
    id: movie._id,
    title: movie.title,
    releaseDate: movie.releaseDate || undefined,
    description: movie.description || undefined,
    duration: movie.duration || undefined
});

const returnMovies = async (req, res) => {
    try {
        const user = await userModel.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Stored as ObjectIds: aggregation pipelines are not cast by Mongoose, so the
        // $nin below must compare ObjectIds with ObjectIds.
        const watchedIds = user.watchHistory.map(entry => entry.movieId);

        const promoted = await categoryModel.find({ isPromoted: true });
        const result = [];

        for (const category of promoted) {
            const movies = await movieModel.aggregate([
                { $match: { categories: category._id, _id: { $nin: watchedIds } } },
                { $sample: { size: MAX_ROW_MOVIES } }
            ]);
            if (movies.length > 0) {
                result.push({ category: category.name, movies: movies.map(formatHomeMovie) });
            }
        }

        // The 20 most recently watched movies, newest first
        const recentIds = watchedIds.slice(-MAX_ROW_MOVIES).reverse();
        const recentMovies = await movieModel.find({ _id: { $in: recentIds } }).lean();
        const byId = new Map(recentMovies.map(movie => [String(movie._id), movie]));
        const history = recentIds.map(id => byId.get(String(id))).filter(Boolean);
        if (history.length > 0) {
            result.push({ category: 'Watch History', movies: history.map(formatHomeMovie) });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const watchMovie = async (req, res) => {
    try {
        const userId = req.userId;
        const movieId = req.params.id;

        // Check if the movieId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const movie = await movieModel.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // One atomic update: drop any earlier entry for this movie and append a fresh one.
        // (A read-modify-write here lost updates when two watches raced.)
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
        const historyIds = user.watchHistory.map(entry => entry.movieId).join(' ');

        // Send the user's full history: PATCH is idempotent, so this also repairs any
        // earlier divergence between MongoDB and the recommendation server.
        try {
            const reply = await recClient.send(`PATCH ${userId} ${historyIds}`);
            if (reply.code !== 204) {
                console.error(`Recommendation server rejected PATCH: ${reply.code} ${reply.reason}`);
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

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const recommendMovies = async (req, res) => {
    try {
        const userId = req.userId;
        const movieId = req.params.id;

        // Check if the movieId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(movieId)) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const movie = await movieModel.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let reply;
        try {
            reply = await recClient.send(`GET ${userId} ${movieId}`);
        } catch (error) {
            if (error instanceof recClient.RecServerError) {
                console.error(error.message);
                return res.status(503).json({ error: 'Recommendation service unavailable' });
            }
            throw error;
        }
        if (reply.code !== 200) {
            console.error(`Recommendation server rejected GET: ${reply.code} ${reply.reason}`);
            return res.status(502).json({ error: 'Recommendation service error' });
        }

        res.status(200).json({ "Recommended Movies": reply.ids.join(' ') });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const searchMovies = async (req, res) => {
    try {
        const query = req.params.query;
        console.log(query);

        const searchCriteria = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { categories: { $elemMatch: { name: { $regex: query, $options: "i" } } } }
        ];
        // Check if the query is a valid date
        if (!isNaN(Date.parse(query))) {
            searchCriteria.push({ releaseDate: query });
        }

        const movies = await movieModel.find({
            $or: searchCriteria,
        }).populate('categories', 'name');
        console.log(movies);
        res.status(200).json(movies.map(movie => ({
            id: movie._id,
            title: movie.title,
            categories: movie.categories.map(category => category.name),
            releaseDate: movie.releaseDate,
            description: movie.description,
            duration: movie.duration
        })));

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


module.exports = { createMovie, getMovie, updateMovie, deleteMovie, returnMovies, watchMovie, recommendMovies, searchMovies };