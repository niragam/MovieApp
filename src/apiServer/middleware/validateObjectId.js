const mongoose = require('mongoose');

// A route param that is not a 24-character hex ObjectId cannot name an existing
// resource, so it gets the same 404 as a missing one (e.g. GET /api/categories/foo ->
// 404 {"error": "Category not found"}, as in the assignment's examples). Without this,
// Mongoose would throw a CastError that surfaces as a 500.
const validateObjectId = (resource, param = 'id') => (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params[param])) {
        return res.status(404).json({ error: `${resource} not found` });
    }
    next();
};

module.exports = validateObjectId;
