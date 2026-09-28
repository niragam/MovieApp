// Keeps the recommendation server's data in line with MongoDB, the source of truth.
const userModel = require('../models/users');
const recClient = require('./recClient');

// Makes the recommendation server hold (at least) this user's full history.
// PATCH only works for users created with POST (assignment part 2), so a 404 means the
// server doesn't know the user yet (new user, or the server lost its data): create it with
// POST. If a concurrent request created it first, POST answers 404 and PATCH is retried.
const syncUserHistory = async (userId, movieIds) => {
    if (movieIds.length === 0) return { code: 204 };
    const line = `${userId} ${movieIds.join(' ')}`;
    let reply = await recClient.send(`PATCH ${line}`);
    if (reply.code === 404) {
        reply = await recClient.send(`POST ${line}`);
        if (reply.code === 404) {
            reply = await recClient.send(`PATCH ${line}`);
        }
    }
    return reply;
};

const historyIds = user => user.watchHistory.map(entry => String(entry.movieId));

const syncAllHistories = async () => {
    const users = await userModel.find({ 'watchHistory.0': { $exists: true } }, { watchHistory: 1 });
    for (const user of users) {
        await syncUserHistory(user._id, historyIds(user));
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

module.exports = { syncUserHistory, syncAllHistories, syncInBackground, historyIds };
