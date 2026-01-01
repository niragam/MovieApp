const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    categories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }],
    releaseDate: {
        type: Date,
        default: null,
        required: false
    },
    description: {
        type: String,
        default: null,
        required: false
    },
    duration: {
        type: Number,
        default: null,
        required: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Movie', MovieSchema);