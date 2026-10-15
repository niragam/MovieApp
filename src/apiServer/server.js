require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { syncInBackground } = require('./services/recSync');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/netflix';
const port = process.env.PORT || 3000;

const start = async () => {
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET must be set (see .env.example)');
        process.exit(1);
    }
    try {
        await mongoose.connect(mongoUri);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    syncInBackground();
};

start();
