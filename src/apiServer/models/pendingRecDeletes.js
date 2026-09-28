const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// A watch that MongoDB no longer has (its movie was deleted) but that could not be
// removed from the recommendation server at the time, e.g. because it was down.
// services/recSync.js retries these so stale watches don't skew recommendations.
const PendingRecDeleteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    movieId: { type: Schema.Types.ObjectId, required: true },
}, { versionKey: false });

PendingRecDeleteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('PendingRecDelete', PendingRecDeleteSchema);
