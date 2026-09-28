// Keeps the recommendation server's data in line with MongoDB, the source of truth.
const userModel = require('../models/users');
const pendingDeleteModel = require('../models/pendingRecDeletes');
const recClient = require('./recClient');

// Removes a deleted movie from a user's recommendation data. If the server can't be
// reached, the removal is stored and retried later by flushPendingDeletes.
const removeWatch = async (userId, movieId) => {
    try {
        const reply = await recClient.send(`DELETE ${userId} ${movieId}`);
        // 404: the server never had this watch (or already dropped it) - nothing to do
        if (reply.code === 204 || reply.code === 404) return;
        console.error(`Recommendation server rejected DELETE: ${reply.code} ${reply.reason}`);
    } catch (error) {
        if (!(error instanceof recClient.RecServerError)) throw error;
        console.error(`Could not remove movie ${movieId} for user ${userId}: ${error.message}`);
    }
    await pendingDeleteModel.updateOne({ userId, movieId }, { $setOnInsert: { userId, movieId } }, { upsert: true });
};

// Retries stored removals (all of them, or one user's). Throws RecServerError if the
// server is still unreachable; entries stay stored until the server confirms them.
const flushPendingDeletes = async (userId) => {
    const pending = await pendingDeleteModel.find(userId ? { userId } : {});
    for (const entry of pending) {
        const reply = await recClient.send(`DELETE ${entry.userId} ${entry.movieId}`);
        if (reply.code === 204 || reply.code === 404) {
            await pendingDeleteModel.deleteOne({ _id: entry._id });
        }
    }
    return pending.length;
};

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
    await flushPendingDeletes();
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

module.exports = { syncUserHistory, syncAllHistories, syncInBackground, historyIds, removeWatch, flushPendingDeletes };
