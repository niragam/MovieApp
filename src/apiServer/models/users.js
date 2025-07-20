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
    profilePicture: {
        type: String,
        default: 'profile.png'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    watchHistory: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model('User', UserSchema);