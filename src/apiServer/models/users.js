const mongoose = require('mongoose');
const { httpUrlField } = require('../services/validation');
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
        required: true,
        trim: true
    },
    avatarUrl: httpUrlField('avatarUrl'),
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
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