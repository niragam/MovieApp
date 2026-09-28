const request = require('supertest');
const mongoose = require('mongoose');
const h = require('./helpers');
const app = require('../app');

describe('watch and recommend through the recommendation server', () => {
    let fake, admin, user, movieId;

    beforeAll(h.startMongo);
    afterAll(h.stopMongo);

    beforeEach(async () => {
        await h.clearMongo();
        fake = await h.startFakeRecServer(line => (line.startsWith('GET') ? '200 Ok\tr1 r2' : '204 No Content'));
        admin = await h.makeAdmin(app);
        user = await h.registerAndLogin(app, 'alice');
        await request(app).post('/api/categories').set(h.auth(admin.token)).send({ name: 'Action', isPromoted: true });
        const created = await request(app).post('/api/movies').set(h.auth(admin.token)).send({ title: 'M', categories: ['Action'] });
        movieId = created.headers.location.split('/').pop();
    });

    afterEach(async () => { if (fake) await fake.close(); fake = null; });

    test('registration does not contact the recommendation server', async () => {
        expect(fake.received).toEqual([]);
    });

    test('watch sends the full history as one PATCH and returns 204', async () => {
        const res = await request(app).post(`/api/movies/${movieId}/recommend`).set(h.auth(user.token));
        expect(res.status).toBe(204);
        expect(fake.received).toEqual([`PATCH ${user.userId} ${movieId}`]);
    });

    test('recommend returns the ids from the recommendation server', async () => {
        const res = await request(app).get(`/api/movies/${movieId}/recommend`).set(h.auth(user.token));
        expect(res.status).toBe(200);
        expect(fake.received).toEqual([`GET ${user.userId} ${movieId}`]);
    });

    test('recommendation server down: watch is 502, recommend is 503, the API stays up', async () => {
        await fake.close(); fake = null;
        await h.pointRecServerAtClosedPort();

        const watch = await request(app).post(`/api/movies/${movieId}/recommend`).set(h.auth(user.token));
        expect(watch.status).toBe(502);
        expect(watch.body.error).toMatch(/unavailable/);

        // MongoDB is the source of truth and was still updated
        const stored = await mongoose.connection.db.collection('users').findOne({ username: 'alice' });
        expect(stored.watchHistory.map(entry => String(entry.movieId))).toEqual([movieId]);

        const rec = await request(app).get(`/api/movies/${movieId}/recommend`).set(h.auth(user.token));
        expect(rec.status).toBe(503);

        const alive = await request(app).get('/api/categories');
        expect(alive.status).toBe(200);
    });

    test('recommendation server that never replies: request completes within the timeout', async () => {
        fake.setHandler(() => null);
        const started = Date.now();
        const res = await request(app).post(`/api/movies/${movieId}/recommend`).set(h.auth(user.token));
        expect(res.status).toBe(502);
        expect(Date.now() - started).toBeLessThan(3000);
    });
});

describe('startup resync', () => {
    beforeAll(h.startMongo);
    afterAll(h.stopMongo);

    test('replays every non-empty history as a PATCH', async () => {
        await h.clearMongo();
        const { syncAllHistories } = require('../services/recSync');
        const users = mongoose.connection.db.collection('users');
        const a = new mongoose.Types.ObjectId(), b = new mongoose.Types.ObjectId();
        const m1 = new mongoose.Types.ObjectId(), m2 = new mongoose.Types.ObjectId();
        await users.insertMany([
            { _id: a, username: 'a', password: 'x', name: 'a', watchHistory: [
                { movieId: m1, watchedAt: new Date(1) }, { movieId: m2, watchedAt: new Date(2) }] },
            { _id: b, username: 'b', password: 'x', name: 'b', watchHistory: [] },
        ]);
        const fake = await h.startFakeRecServer();
        await expect(syncAllHistories()).resolves.toBe(1);
        expect(fake.received).toEqual([`PATCH ${a} ${m1} ${m2}`]);
        await fake.close();
    });
});
