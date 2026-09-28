// One-off migration: convert legacy watchHistory arrays of movie-id strings into
// [{ movieId: ObjectId, watchedAt: Date }], preserving order (oldest first).
// Usage: MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/migrate-watch-history.js
require('dotenv').config();
const mongoose = require('mongoose');

const migrate = async (db) => {
    const users = db.collection('users');
    let migrated = 0;
    for await (const user of users.find({ 'watchHistory.0': { $type: 'string' } })) {
        const now = Date.now();
        const entries = user.watchHistory
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map((id, index, all) => ({
                movieId: new mongoose.Types.ObjectId(id),
                // Synthesize increasing timestamps so the original order is kept
                watchedAt: new Date(now - (all.length - 1 - index) * 1000),
            }));
        await users.updateOne({ _id: user._id }, { $set: { watchHistory: entries } });
        migrated++;
    }
    return migrated;
};

if (require.main === module) {
    (async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/netflix');
        const count = await migrate(mongoose.connection.db);
        console.log(`Migrated ${count} users`);
        await mongoose.disconnect();
    })().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { migrate };
