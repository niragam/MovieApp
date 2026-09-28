const { RecServerError } = require('../services/recClient');

const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Malformed JSON body' });
    }
    if (err.name === 'ValidationError') {
        const first = Object.values(err.errors)[0];
        return res.status(400).json({ error: first ? first.message : 'Invalid input' });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ error: `Invalid ${err.path}` });
    }
    if (err.code === 11000) {
        return res.status(409).json({ error: 'Already exists' });
    }
    if (err instanceof RecServerError) {
        console.error(err.message);
        return res.status(503).json({ error: 'Recommendation service unavailable' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
