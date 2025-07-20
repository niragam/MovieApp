const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    isPromoted: {
        type: Boolean,
        default: false
    }
}, { versionKey: false });

module.exports = mongoose.model('Category', CategorySchema);
