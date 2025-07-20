const User = require('../models/users');
require('dotenv').config();
const net = require('net');

const externalServerHost = process.env.RECSERVER_HOST || "recserver";
const externalServerPort = process.env.RECSERVER_PORT || 8000;

const createUser = async (req, res) => {
    try {
        const { username, password, name, profilePicture } = req.body;

        if (!username || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const user = new User({
            username,
            password,
            name,
            profilePicture
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
        
        res.status(201)
            .location(`/api/users/${user._id}`)
            .end();

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
            profilePicture: user.profilePicture,
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

        res.status(200).json({
            userId: user._id
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { createUser, getUser, loginUser };