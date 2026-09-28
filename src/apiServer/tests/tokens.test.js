const request = require('supertest');
const h = require('./helpers');
const app = require('../app');

describe('POST /api/tokens', () => {
    beforeAll(h.startMongo);
    afterAll(h.stopMongo);
    beforeEach(async () => {
        await h.clearMongo();
        await request(app).post('/api/users').send({ username: 'bob', password: 'Passw0rd1', name: 'Bob' });
    });

    test('returns a token for valid credentials', async () => {
        const res = await request(app).post('/api/tokens').send({ username: 'bob', password: 'Passw0rd1' });
        expect(res.status).toBe(200);
        expect(res.body.token).toEqual(expect.any(String));
        expect(res.body).not.toHaveProperty('password');
    });

    test('401 for a wrong password, 400 for missing fields', async () => {
        expect((await request(app).post('/api/tokens').send({ username: 'bob', password: 'nope' })).status).toBe(401);
        expect((await request(app).post('/api/tokens').send({ username: 'bob' })).status).toBe(400);
    });

    test('the old /api/users/tokens path is gone', async () => {
        const res = await request(app).post('/api/users/tokens').send({ username: 'bob', password: 'Passw0rd1' });
        expect(res.status).toBe(404);
    });
});
