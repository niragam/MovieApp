const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true
    },
    // Promoted categories appear as rows on the homepage.
    isPromoted: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Category', CategorySchema);
