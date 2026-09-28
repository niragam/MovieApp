const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const h = require('./helpers');
const app = require('../app');

describe('credentials and tokens', () => {
    beforeAll(h.startMongo);
    afterAll(h.stopMongo);
    beforeEach(h.clearMongo);

    test('passwords are stored hashed and still work for login', async () => {
        const { token } = await h.registerAndLogin(app, 'carol');
        expect(token).toEqual(expect.any(String));
        const stored = await mongoose.connection.db.collection('users').findOne({ username: 'carol' });
        expect(stored.password).not.toBe('Passw0rd1');
        expect(stored.password).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    });

    test('a token signed with another secret is rejected', async () => {
        const { userId } = await h.registerAndLogin(app, 'dave');
        const forged = jwt.sign({ userId, username: 'dave', role: 'admin' }, 'your-secret-key-change-in-production');
        const res = await request(app).post('/api/categories').set(h.auth(forged)).send({ name: 'X' });
        expect(res.status).toBe(401);
    });

    test('non-admin users cannot manage categories', async () => {
        const { token } = await h.registerAndLogin(app, 'erin');
        expect((await request(app).post('/api/categories').set(h.auth(token)).send({ name: 'X' })).status).toBe(403);
    });

    test('non-string credentials are rejected', async () => {
        expect((await request(app).post('/api/users').send({ username: 12345, password: 'Passw0rd1', name: 'n' })).status).toBe(400);
        expect((await request(app).post('/api/tokens').send({ username: { $gt: '' }, password: 'x' })).status).toBe(401);
    });

    test('profile responses never include the password', async () => {
        const { token, userId } = await h.registerAndLogin(app, 'frank');
        const res = await request(app).get(`/api/users/${userId}`).set(h.auth(token));
        expect(res.status).toBe(200);
        expect(res.body).not.toHaveProperty('password');
    });

    test('hash-passwords migration hashes legacy plaintext only', async () => {
        const { hashPlaintextPasswords } = require('../scripts/hash-passwords');
        const users = mongoose.connection.db.collection('users');
        await users.insertOne({ username: 'legacy', password: 'Plain1234', name: 'l', watchHistory: [] });
        await h.registerAndLogin(app, 'modern');
        expect(await hashPlaintextPasswords(mongoose.connection.db)).toBe(1);
        const login = await request(app).post('/api/tokens').send({ username: 'legacy', password: 'Plain1234' });
        expect(login.status).toBe(200);
    });
});
