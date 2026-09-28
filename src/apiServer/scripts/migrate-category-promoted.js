// One-off migration: rename the category field isPromoted -> promoted (the name used by
// the assignment's API examples).
// Usage: MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/migrate-category-promoted.js
require('dotenv').config();
const mongoose = require('mongoose');

const migrate = async (db) => {
    const result = await db.collection('categories').updateMany(
        { isPromoted: { $exists: true } },
        { $rename: { isPromoted: 'promoted' } }
    );
    return result.modifiedCount;
};

if (require.main === module) {
    (async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/netflix');
        console.log(`Migrated ${await migrate(mongoose.connection.db)} categories`);
        await mongoose.disconnect();
    })().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { migrate };
