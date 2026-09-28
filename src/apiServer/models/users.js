const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Oldest first: re-watching a movie moves it to the end with a fresh timestamp.
    watchHistory: {
        type: [new Schema({
            movieId: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
            watchedAt: { type: Date, required: true }
        }, { _id: false })],
        default: []
    }
});

UserSchema.index({ 'watchHistory.movieId': 1 });

module.exports = mongoose.model('User', UserSchema);