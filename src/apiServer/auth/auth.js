const auth = (req, res, next) => {
    const userId = req.header('userId');

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    req.userId = userId;
    next();
};

module.exports = auth;