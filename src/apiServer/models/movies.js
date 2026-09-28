const mongoose = require('mongoose');
const { httpUrlField } = require('../services/validation');

const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 1
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
        min: 0,
        required: false
    },
    posterUrl: httpUrlField('posterUrl'),
    backdropUrl: httpUrlField('backdropUrl'),
    videoUrl: httpUrlField('videoUrl')
}, { versionKey: false });

MovieSchema.index({ categories: 1 });

module.exports = mongoose.model('Movie', MovieSchema);
