const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const movieRoutes = require('./routes/movies');

const app = express();
app.use(express.json());

app.disable('etag');

app.use((req, res, next) => {
    res.removeHeader('Date');
    next();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes); 
app.use('/api/movies', movieRoutes);

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/netflix';
const port = process.env.PORT || 3000;
mongoose.connect(mongoUri);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port);