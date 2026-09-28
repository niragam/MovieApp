const request = require('supertest');
const mongoose = require('mongoose');
const h = require('./helpers');
const app = require('../app');

let fake, admin, user;
const A = () => h.auth(admin.token);
const U = () => h.auth(user.token);
const newCategory = (name, promoted = true) =>
    request(app).post('/api/categories').set(A()).send({ name, promoted });
const idFrom = res => res.headers.location.split('/').pop();
const newMovie = async (body) => idFrom(await request(app).post('/api/movies').set(A()).send(body));

beforeAll(h.startMongo);
afterAll(h.stopMongo);
beforeEach(async () => {
    await h.clearMongo();
    fake = await h.startFakeRecServer();
    admin = await h.makeAdmin(app);
    user = await h.registerAndLogin(app, 'viewer');
});
afterEach(() => fake.close());

describe('error handling and validation', () => {
    test('invalid ids are 404 on every :id route', async () => {
        const cases = [
            request(app).get('/api/users/nope').set(U()),
            request(app).get('/api/categories/nope'),
            request(app).patch('/api/categories/nope').set(A()).send({ name: 'x' }),
            request(app).delete('/api/categories/nope').set(A()),
            request(app).get('/api/movies/nope'),
            request(app).put('/api/movies/nope').set(A()).send({}),
            request(app).delete('/api/movies/nope').set(A()),
            request(app).get('/api/movies/nope/recommend').set(U()),
            request(app).post('/api/movies/nope/recommend').set(U()),
        ];
        for (const res of await Promise.all(cases)) {
            expect(res.status).toBe(404);
            expect(res.body.error).toMatch(/^(User|Category|Movie) not found$/);
        }
        expect((await request(app).get('/api/categories/foo')).body).toEqual({ error: 'Category not found' });
    });

    test('well-formed but unknown ids are 404', async () => {
        const ghost = String(new mongoose.Types.ObjectId());
        expect((await request(app).get(`/api/users/${ghost}`).set(U())).status).toBe(404);
        expect((await request(app).get(`/api/categories/${ghost}`)).status).toBe(404);
        expect((await request(app).get(`/api/movies/${ghost}`)).status).toBe(404);
        expect((await request(app).get(`/api/movies/${ghost}/recommend`).set(U())).status).toBe(404);
    });

    test('malformed JSON is 400', async () => {
        const res = await request(app).post('/api/users').set('Content-Type', 'application/json').send('{bad');
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Malformed JSON/);
    });

    test('unknown /api routes return a JSON 404', async () => {
        const res = await request(app).get('/api/nope');
        expect(res.status).toBe(404);
        expect(res.headers['content-type']).toMatch(/json/);
    });

    test('recommendation server down on GET recommend is a JSON 503', async () => {
        await newCategory('Action');
        const id = await newMovie({ title: 'M', categories: ['Action'] });
        await fake.close();
        await h.pointRecServerAtClosedPort();
        const res = await request(app).get(`/api/movies/${id}/recommend`).set(U());
        expect(res.status).toBe(503);
        expect(res.body.error).toMatch(/unavailable/);
        fake = await h.startFakeRecServer();
    });
});

describe('users', () => {
    test('registration returns the profile, with optional avatar', async () => {
        const res = await request(app).post('/api/users')
            .send({ username: 'pic', password: 'Passw0rd1', name: 'Pic', avatarUrl: 'https://example.com/a.png' });
        expect(res.status).toBe(201);
        expect(res.headers.location).toBe(`/api/users/${res.body.id}`);
        expect(res.body).toMatchObject({ username: 'pic', name: 'Pic', avatarUrl: 'https://example.com/a.png' });
        const login = await request(app).post('/api/tokens').send({ username: 'pic', password: 'Passw0rd1' });
        expect(login.body.avatarUrl).toBe('https://example.com/a.png');
    });

    test('invalid avatar URL is 400; duplicate username is 409', async () => {
        const bad = await request(app).post('/api/users')
            .send({ username: 'pic2', password: 'Passw0rd1', name: 'P', avatarUrl: 'javascript:alert(1)' });
        expect(bad.status).toBe(400);
        const dup = await request(app).post('/api/users').send({ username: 'viewer', password: 'Passw0rd1', name: 'V' });
        expect(dup.status).toBe(409);
    });

    test('simultaneous duplicate registrations: exactly one wins, the other is 409', async () => {
        const body = { username: 'racer', password: 'Passw0rd1', name: 'R' };
        const results = await Promise.all([1, 2, 3].map(() => request(app).post('/api/users').send(body)));
        expect(results.map(r => r.status).sort()).toEqual([201, 409, 409]);
    });
});

describe('categories', () => {
    test('create is 201 with Location and no body; list and get return {id, name, promoted}', async () => {
        const res = await newCategory('Action');
        expect(res.status).toBe(201);
        expect(res.headers.location).toMatch(/^\/api\/categories\/[0-9a-f]{24}$/);
        expect(res.text).toBe('');
        const id = idFrom(res);
        expect((await request(app).get('/api/categories')).body).toEqual([{ id, name: 'Action', promoted: true }]);
        expect((await request(app).get(`/api/categories/${id}`)).body).toEqual({ id, name: 'Action', promoted: true });
    });

    test('missing name is 400 "Name is required"', async () => {
        const res = await request(app).post('/api/categories').set(A()).send({ promoted: false });
        expect(res.status).toBe(400);
        expect(res.body).toEqual({ error: 'Name is required' });
    });

    test('promoted migration renames the old field', async () => {
        await mongoose.connection.db.collection('categories').insertOne({ name: 'Old', isPromoted: true });
        const { migrate } = require('../scripts/migrate-category-promoted');
        expect(await migrate(mongoose.connection.db)).toBe(1);
        expect((await request(app).get('/api/categories')).body[0]).toMatchObject({ name: 'Old', promoted: true });
    });

    test('names must be non-empty and unique, including on rename', async () => {
        expect((await request(app).post('/api/categories').set(A()).send({ name: '  ' })).status).toBe(400);
        const a = idFrom(await newCategory('Action'));
        await newCategory('Drama');
        expect((await newCategory('Action')).status).toBe(409);
        expect((await request(app).patch(`/api/categories/${a}`).set(A()).send({ name: '' })).status).toBe(400);
        expect((await request(app).patch(`/api/categories/${a}`).set(A()).send({ name: 'Drama' })).status).toBe(409);
        expect((await request(app).patch(`/api/categories/${a}`).set(A()).send({ promoted: 'yes' })).status).toBe(400);
    });

    test('PATCH is partial', async () => {
        const id = idFrom(await newCategory('Action', false));
        expect((await request(app).patch(`/api/categories/${id}`).set(A()).send({ promoted: true })).status).toBe(204);
        expect((await request(app).get(`/api/categories/${id}`)).body).toMatchObject({ name: 'Action', promoted: true });
    });

    test('deleting a category removes it from movies', async () => {
        const drama = idFrom(await newCategory('Drama'));
        await newCategory('Action');
        const movie = await newMovie({ title: 'Both', categories: ['Drama', 'Action'] });
        expect((await request(app).delete(`/api/categories/${drama}`).set(A())).status).toBe(204);
        expect((await request(app).get(`/api/movies/${movie}`)).body.categories).toEqual(['Action']);
        const raw = await mongoose.connection.db.collection('movies').findOne({});
        expect(raw.categories.map(String)).not.toContain(drama);
    });
});

describe('movies', () => {
    beforeEach(() => newCategory('Action'));

    test('create/get round-trips media fields and derives releaseYear', async () => {
        const res = await request(app).post('/api/movies').set(A()).send({
            title: 'Film', categories: ['Action'], releaseDate: '1999-03-31', duration: 120, description: 'D',
            posterUrl: 'https://img/p.jpg', backdropUrl: 'https://img/b.jpg', videoUrl: 'https://vid/v.mp4'
        });
        expect(res.status).toBe(201);
        expect(res.text).toBe('');
        const movie = (await request(app).get(`/api/movies/${idFrom(res)}`)).body;
        expect(movie).toMatchObject({
            id: idFrom(res), title: 'Film', categories: ['Action'], releaseYear: 1999, duration: 120,
            posterUrl: 'https://img/p.jpg', backdropUrl: 'https://img/b.jpg', videoUrl: 'https://vid/v.mp4'
        });
    });

    test('input validation', async () => {
        const post = body => request(app).post('/api/movies').set(A()).send(body);
        expect((await post({ categories: ['Action'] })).status).toBe(400);
        expect((await post({ title: 'T', categories: 'Action' })).status).toBe(400);
        expect((await post({ title: 'T', categories: [] })).status).toBe(400);
        expect((await post({ title: 'T', categories: ['Nope'] })).status).toBe(404);
        expect((await post({ title: 'T', categories: ['Action'], videoUrl: 'ftp://x' })).status).toBe(400);
        expect((await post({ title: 'T', categories: ['Action'], duration: 'long' })).status).toBe(400);
    });

    test('PUT replaces the movie', async () => {
        const id = await newMovie({ title: 'Old', categories: ['Action'], description: 'gone' });
        expect((await request(app).put(`/api/movies/${id}`).set(A()).send({ title: 'New', categories: ['Action'] })).status).toBe(204);
        expect((await request(app).get(`/api/movies/${id}`)).body).toMatchObject({ title: 'New', description: null });
    });

    test('admin can list every movie, including ones outside promoted categories', async () => {
        await newCategory('Docs', false);
        await newMovie({ title: 'B', categories: ['Action'] });
        await newMovie({ title: 'A', categories: ['Docs'] });
        const res = await request(app).get('/api/movies/all').set(A());
        expect(res.status).toBe(200);
        expect(res.body.map(m => m.title)).toEqual(['A', 'B']);
        expect((await request(app).get('/api/movies/all').set(U())).status).toBe(403);
    });

    test('recommendations are full movies in recommendation-server order, skipping deleted ones', async () => {
        const [m, r1, r2, gone] = [
            await newMovie({ title: 'Seed', categories: ['Action'] }),
            await newMovie({ title: 'R1', categories: ['Action'] }),
            await newMovie({ title: 'R2', categories: ['Action'] }),
            await newMovie({ title: 'Gone', categories: ['Action'] }),
        ];
        await request(app).delete(`/api/movies/${gone}`).set(A());
        fake.setHandler(line => (line.startsWith('GET') ? `200 Ok\n\n${r2} ${gone} ${r1}` : '204 No Content'));
        const res = await request(app).get(`/api/movies/${m}/recommend`).set(U());
        expect(res.status).toBe(200);
        expect(res.body.map(movie => movie.title)).toEqual(['R2', 'R1']);
        expect(res.body[0]).toHaveProperty('categories', ['Action']);
    });
});

describe('search', () => {
    beforeEach(async () => {
        await newCategory('Sci-Fi');
        await newCategory('Drama');
        await newMovie({ title: 'The Matrix', categories: ['Sci-Fi'], description: 'A hacker (Neo) learns the truth', releaseDate: '1999-03-31' });
        await newMovie({ title: 'Titanic', categories: ['Drama'], description: 'A ship sinks', releaseDate: '1997-12-19' });
    });
    const search = q => request(app).get(`/api/movies/search/${encodeURIComponent(q)}`);
    const titles = async q => (await search(q)).body.map(m => m.title);

    test('matches title and description case-insensitively', async () => {
        expect(await titles('matrix')).toEqual(['The Matrix']);
        expect(await titles('SHIP')).toEqual(['Titanic']);
    });

    test('matches category names and release year', async () => {
        expect(await titles('sci-fi')).toEqual(['The Matrix']);
        expect(await titles('1997')).toEqual(['Titanic']);
    });

    test('regex metacharacters are matched literally', async () => {
        expect((await search('(')).status).toBe(200);
        expect(await titles('(neo)')).toEqual(['The Matrix']);
        expect(await titles('.*')).toEqual([]);
    });

    test('empty query is 400, no match is an empty array', async () => {
        expect((await request(app).get('/api/movies/search/')).status).toBe(400);
        expect((await request(app).get('/api/movies/search')).status).toBe(400);
        expect((await search('   ')).status).toBe(400);
        expect(await titles('zzz')).toEqual([]);
    });

    test('any movie field counts: duration, full date, URLs, id', async () => {
        await newCategory('Docs');
        const id = await newMovie({
            title: 'Plain', categories: ['Docs'], duration: 136, releaseDate: '2001-05-17',
            videoUrl: 'https://cdn.example.com/UniqueClip.mp4', posterUrl: 'https://img.example.com/p.jpg'
        });
        expect(await titles('136')).toContain('Plain');
        expect(await titles('2001-05-17')).toEqual(['Plain']);
        expect(await titles('uniqueclip')).toEqual(['Plain']);
        expect(await titles(id)).toEqual(['Plain']);
        expect(await titles('1999-03')).toEqual(['The Matrix']);
    });

    test('returns every match (no cap)', async () => {
        for (let i = 0; i < 55; i++) await newMovie({ title: `Bulk ${i}`, categories: ['Drama'] });
        expect((await search('bulk')).body).toHaveLength(55);
    });
});
