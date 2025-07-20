const mongoose = require('mongoose');
require('dotenv').config();
const movieModel = require('../models/movies');
const categoryModel = require('../models/categories');
const userModel = require('../models/users');
const net = require('net');

const externalServerHost = process.env.RECSERVER_HOST || "recserver";
const externalServerPort = process.env.RECSERVER_PORT || 8000;

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
        // Delete the movie from users' watch history
        await userModel.updateMany({}, { $pull: { watchHistory: movieId } });

        // Delete the movie from the database
        await movieModel.findByIdAndDelete(movieId);

        const users = await userModel.find();
        for (const user of users) {
            const message = `DELETE ${user._id} ${movieId}\n`;
            const client = new net.Socket();
            client.connect(externalServerPort, externalServerHost, () => {
                client.write(message);
                client.end();
            });
        }
        res.status(204).end();

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const returnMovies = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const watchHistory = user.watchHistory || [];

        const categories = await categoryModel.find();
        const result = [];

        for (const category of categories) {
            if (category.isPromoted) {
                const movies = await movieModel.aggregate([
                    {
                        $match: {
                            categories: category._id,
                            _id: { $nin: watchHistory }
                        }
                    },
                    { $sample: { size: 20 } }
                ]);

                if (movies.length > 0) {
                    const formattedMovies = movies.map(movie => ({
                        id: movie._id,
                        title: movie.title,
                        releaseDate: movie.releaseDate || undefined,
                        description: movie.description || undefined,
                        duration: movie.duration || undefined
                    }));

                    result.push({
                        category: category.name,
                        movies: formattedMovies
                    });
                }
            }
        }

        const watchedMovies = await movieModel.aggregate([
            { $match: { _id: { $in: watchHistory.map(id => mongoose.Types.ObjectId(id)) } } },
            { $sample: { size: 20 } }
        ]);

        if (watchedMovies.length > 0) {
            const formattedWatchedMovies = watchedMovies.map(movie => ({
                id: movie._id,
                title: movie.title,
                releaseDate: movie.releaseDate || undefined,
                description: movie.description || undefined,
                duration: movie.duration || undefined
            }));

            result.push({
                category: "Watch History",
                movies: formattedWatchedMovies
            });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
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

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingIndex = user.watchHistory.indexOf(movieId);
        if (existingIndex !== -1) {
            // Remove the movieId from the watchHistory array to avoid duplicates
            user.watchHistory.splice(existingIndex, 1);
        }
        user.watchHistory.push(movieId);
        await user.save();

        // Send a message to the external server
        const client = new net.Socket();

        const message = `PATCH ${userId} ${movieId}\n`;
        client.connect(externalServerPort, externalServerHost, () => {
            client.write(message);

            client.on('data', (data) => {
                const response = data.toString();
                // statusCode = first word of response turned into a number
                const statusCode = parseInt(response.split(' ')[0]);
                res.status(statusCode).end();
                client.end();
            });
        });

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

        // Send a message to the external server
        const client = new net.Socket();

        const message = `GET ${userId} ${movieId}\n`;
        client.connect(externalServerPort, externalServerHost, () => {
            client.write(message);

            client.on('data', (data) => {
                const response = data.toString();
                let parts = response.split("\n\n");

                // statusCode = first word of response turned into a number
                let statusCode = parseInt(parts[0].split(' ')[0]);
                if (statusCode === 200) {
                    res.status(statusCode).json({
                        "Recommended Movies": parts[1].toString().trim()
                    });
                }
                else {
                    res.status(statusCode).end();
                }
                client.end();
            });
        });
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