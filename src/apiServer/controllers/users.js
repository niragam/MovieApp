const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getJwtSecret } = require('../auth/auth');

const BCRYPT_ROUNDS = 10;

const toProfile = user => ({
    id: user._id,
    username: user.username,
    name: user.name,
    avatarUrl: user.avatarUrl || null,
    role: user.role,
    createdAt: user.createdAt
});

const createUser = async (req, res) => {
    const { username, password, name, avatarUrl } = req.body;

    if (!username || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (typeof username !== 'string' || typeof password !== 'string' || typeof name !== 'string') {
        return res.status(400).json({ error: 'username, password and name must be strings' });
    }
    if (avatarUrl !== undefined && avatarUrl !== null && typeof avatarUrl !== 'string') {
        return res.status(400).json({ error: 'avatarUrl must be a string' });
    }

    // Validate username: min 3 chars, letters/numbers/underscores only
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' });
    }

    // Validate password: min 8 chars, at least 1 letter and 1 number
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters with at least 1 letter and 1 number' });
    }

    if (await User.exists({ username })) {
        return res.status(409).json({ error: 'Username already exists' });
    }

    // A concurrent duplicate registration still hits the unique index -> 409 via the error handler.
    // No recommendation-server call here: it creates users on their first watch.
    const user = await User.create({
        username,
        password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        name,
        avatarUrl: avatarUrl || null
    });

    res.status(201)
        .location(`/api/users/${user._id}`)
        .json(toProfile(user));
};

const getUser = async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(toProfile(user));
};

const loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = typeof username === 'string' ? await User.findOne({ username }) : null;
    if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            username: user.username,
            role: user.role
        },
        getJwtSecret(),
        { expiresIn: '24h' }
    );

    res.status(200).json({
        token,
        userId: user._id,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl || null,
        role: user.role
    });
};

module.exports = { createUser, getUser, loginUser };
