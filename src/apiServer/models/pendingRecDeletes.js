const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PendingRecDeleteSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, required: true },
    movieId: { type: Schema.Types.ObjectId, required: true },
}, { versionKey: false });

PendingRecDeleteSchema.index({ userId: 1, movieId: 1 }, { unique: true });

module.exports = mongoose.model('PendingRecDelete', PendingRecDeleteSchema);
