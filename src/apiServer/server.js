require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { syncInBackground } = require('./services/recSync');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/netflix';
const port = process.env.PORT || 3000;

const start = async () => {
    try {
        await mongoose.connect(mongoUri);
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });

    // Don't block startup on the recommendation server; resync once it is reachable.
    syncInBackground();
};

start();
