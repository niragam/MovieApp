const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const userRoutes = require('./routes/users');
const tokenRoutes = require('./routes/tokens');
const categoryRoutes = require('./routes/categories');
const movieRoutes = require('./routes/movies');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS configuration for frontend
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

app.disable('etag');

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/movies', movieRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
});

const distDir = path.join(__dirname, '../frontend/dist');
const indexHtml = path.join(distDir, 'index.html');
app.use(express.static(distDir));
app.get('*', (req, res, next) => {
    if (!fs.existsSync(indexHtml)) {
        return next();
    }
    res.sendFile(indexHtml);
});

app.use(errorHandler);

module.exports = app;
