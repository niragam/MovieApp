const mongoose = require('mongoose');

const validateObjectId = (resource, param = 'id') => (req, res, next) => {
    if (!mongoose.isObjectIdOrHexString(req.params[param])) {
        return res.status(404).json({ error: `${resource} not found` });
    }
    next();
};

module.exports = validateObjectId;
