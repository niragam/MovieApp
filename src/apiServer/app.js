const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const movieRoutes = require('./routes/movies');

const app = express();

// CORS configuration for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

app.disable('etag');

app.use((req, res, next) => {
    res.removeHeader('Date');
    next();
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/movies', movieRoutes);

// Serve static frontend files (production)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Fallback to index.html for SPA routing
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/netflix';
const port = process.env.PORT || 3000;
mongoose.connect(mongoUri);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});