const mongoose = require('mongoose');

// Rejects route params that are not 24-character hex ObjectIds with 400, instead of
// letting Mongoose throw a CastError that surfaces as a 500.
const validateObjectId = (param = 'id') => (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params[param])) {
        return res.status(400).json({ error: `Invalid ${param}` });
    }
    next();
};

module.exports = validateObjectId;
