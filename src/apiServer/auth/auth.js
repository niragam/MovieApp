const jwt = require('jsonwebtoken');

// No fallback: a secret committed to the repository would let anyone mint admin tokens.
// server.js refuses to start without JWT_SECRET.
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not set');
    }
    return secret;
};

const auth = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.userId = decoded.userId;
        req.username = decoded.username;
        req.userRole = decoded.role;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const adminAuth = (req, res, next) => {
    auth(req, res, () => {
        if (req.userRole !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

module.exports = { auth, adminAuth, getJwtSecret };