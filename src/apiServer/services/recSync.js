// Rebuilds the recommendation server's data from MongoDB, the source of truth.
// PATCH is an idempotent upsert, so replaying every user's history is always safe.
const userModel = require('../models/users');
const recClient = require('./recClient');

const syncAllHistories = async () => {
    const users = await userModel.find({ 'watchHistory.0': { $exists: true } }, { watchHistory: 1 });
    for (const user of users) {
        await recClient.send(`PATCH ${user._id} ${user.watchHistory.join(' ')}`);
    }
    return users.length;
};

// Runs in the background at startup, retrying until the recommendation server answers.
const syncInBackground = async ({ attempts = 10, delayMs = 2000 } = {}) => {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const count = await syncAllHistories();
            console.log(`Recommendation data synced for ${count} users`);
            return true;
        } catch (error) {
            console.error(`Recommendation sync attempt ${attempt}/${attempts} failed: ${error.message}`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
    return false;
};

module.exports = { syncAllHistories, syncInBackground };
