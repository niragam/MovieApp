const request = require('supertest');
const mongoose = require('mongoose');
const h = require('./helpers');
const app = require('../app');

describe('GET /api/movies (homepage) and viewing history', () => {
    let fake, admin, user;
    const createMovies = async (count, categories, prefix) => {
        const ids = [];
        for (let i = 0; i < count; i++) {
            const res = await request(app).post('/api/movies').set(h.auth(admin.token))
                .send({ title: `${prefix} ${i}`, categories });
            ids.push(res.headers.location.split('/').pop());
        }
        return ids;
    };
    const watch = (id, token = user.token) =>
        request(app).post(`/api/movies/${id}/recommend`).set(h.auth(token));
    const home = async (token = user.token) =>
        (await request(app).get('/api/movies').set(h.auth(token))).body;
    const row = (rows, name) => rows.find(r => r.category === name);

    beforeAll(h.startMongo);
    afterAll(h.stopMongo);
    beforeEach(async () => {
        await h.clearMongo();
        fake = await h.startFakeRecServer();
        admin = await h.makeAdmin(app);
        user = await h.registerAndLogin(app, 'viewer');
        await request(app).post('/api/categories').set(h.auth(admin.token)).send({ name: 'Action', isPromoted: true });
        await request(app).post('/api/categories').set(h.auth(admin.token)).send({ name: 'Drama', isPromoted: false });
    });
    afterEach(() => fake.close());

    test('requires authentication', async () => {
        expect((await request(app).get('/api/movies')).status).toBe(401);
    });

    test('only promoted categories appear, each with at most 20 movies', async () => {
        await createMovies(25, ['Action'], 'A');
        await createMovies(3, ['Drama'], 'D');
        const rows = await home();
        expect(rows.map(r => r.category)).toEqual(['Action']);
        expect(row(rows, 'Action').movies).toHaveLength(20);
    });

    test('movies the user watched are excluded from promoted rows', async () => {
        const ids = await createMovies(5, ['Action'], 'A');
        await watch(ids[0]);
        await watch(ids[1]);
        const action = row(await home(), 'Action').movies.map(m => String(m.id));
        expect(action).toHaveLength(3);
        expect(action).not.toContain(ids[0]);
        expect(action).not.toContain(ids[1]);
    });

    test('history row lists the 20 most recent watches, newest first', async () => {
        const ids = await createMovies(22, ['Drama'], 'D');
        for (const id of ids) await watch(id);
        await watch(ids[0]); // re-watch moves it to the front
        const history = row(await home(), 'Watch History').movies.map(m => String(m.id));
        expect(history).toHaveLength(20);
        expect(history[0]).toBe(ids[0]);
        expect(history.slice(1)).toEqual(ids.slice(3).reverse());
    });

    test('no history row before the user watches anything', async () => {
        await createMovies(2, ['Action'], 'A');
        expect(row(await home(), 'Watch History')).toBeUndefined();
    });

    test('history entries carry timestamps and repeated views are not duplicated', async () => {
        const [id] = await createMovies(1, ['Action'], 'A');
        await watch(id);
        await watch(id);
        const stored = await mongoose.connection.db.collection('users').findOne({ username: 'viewer' });
        expect(stored.watchHistory).toHaveLength(1);
        expect(stored.watchHistory[0].watchedAt).toBeInstanceOf(Date);
    });

    test('concurrent watches by the same user are all kept', async () => {
        const ids = await createMovies(8, ['Action'], 'A');
        const results = await Promise.all(ids.map(id => watch(id)));
        expect(results.every(r => r.status === 204)).toBe(true);
        const stored = await mongoose.connection.db.collection('users').findOne({ username: 'viewer' });
        expect(stored.watchHistory.map(e => String(e.movieId)).sort()).toEqual([...ids].sort());
    });

    test('deleting a movie removes it from every history', async () => {
        const ids = await createMovies(2, ['Action'], 'A');
        await watch(ids[0]);
        await request(app).delete(`/api/movies/${ids[0]}`).set(h.auth(admin.token));
        const stored = await mongoose.connection.db.collection('users').findOne({ username: 'viewer' });
        expect(stored.watchHistory).toEqual([]);
        expect(fake.received).toContain(`DELETE ${user.userId} ${ids[0]}`);
    });
});

describe('watch history migration', () => {
    beforeAll(h.startMongo);
    afterAll(h.stopMongo);

    test('converts legacy string arrays, keeping order', async () => {
        await h.clearMongo();
        const { migrate } = require('../scripts/migrate-watch-history');
        const m1 = new mongoose.Types.ObjectId(), m2 = new mongoose.Types.ObjectId();
        const users = mongoose.connection.db.collection('users');
        await users.insertOne({ username: 'legacy', password: 'x', name: 'l', watchHistory: [String(m1), String(m2)] });
        expect(await migrate(mongoose.connection.db)).toBe(1);
        const stored = await users.findOne({ username: 'legacy' });
        expect(stored.watchHistory.map(e => String(e.movieId))).toEqual([String(m1), String(m2)]);
        expect(stored.watchHistory[0].watchedAt < stored.watchHistory[1].watchedAt).toBe(true);
    });
});
