const User = require('../models/users');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../auth/auth');
require('dotenv').config();
const net = require('net');

const externalServerHost = process.env.RECSERVER_HOST || "recserver";
const externalServerPort = process.env.RECSERVER_PORT || 8000;

const createUser = async (req, res) => {
    try {
        const { username, password, name } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate username: min 3 chars, letters/numbers/underscores only
        if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username must be at least 3 characters and contain only letters, numbers, and underscores' });
        }

        // Validate password: min 8 chars, at least 1 letter and 1 number
        if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters with at least 1 letter and 1 number' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const user = new User({
            username,
            password,
            name
        });

        await user.save();
        // Send a message to the external server
        const client = new net.Socket();

        const message = `POST ${user._id} 1\n`;
        const message2 = `DELETE ${user._id} 1\n`;

        client.connect(externalServerPort, externalServerHost, () => {
            client.write(message);
            setTimeout(() => {
                client.write(message2);
                client.end();
            }, 300);
        });

        client.on('error', () => {
            // Silently handle connection errors to external server
        });

        res.status(201)
            .location(`/api/users/${user._id}`)
            .json({ message: 'User created successfully' });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            id: user._id,
            username: user.username,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Missing credentials' });
        }

        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id.toString(),
                username: user.username,
                role: user.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            userId: user._id,
            username: user.username,
            name: user.name,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { createUser, getUser, loginUser };