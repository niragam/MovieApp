// Shared test helpers: in-memory MongoDB, a scriptable fake recommendation server, and auth helpers.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.RECSERVER_HOST = '127.0.0.1';
process.env.RECSERVER_TIMEOUT_MS = process.env.RECSERVER_TIMEOUT_MS || '500';

const net = require('net');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

const startMongo = async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    await Promise.all(Object.values(mongoose.models).map(model => model.syncIndexes()));
};

const stopMongo = async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
};

const clearMongo = async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map(c => c.deleteMany({})));
};

// Fake recommendation server. `handler(line)` returns the reply line (without '\n'),
// or null to never reply. `mode: 'split'` sends each reply in two TCP chunks.
const startFakeRecServer = async (handler = () => '204 No Content', { mode = 'normal' } = {}) => {
    const received = [];
    const sockets = new Set();
    const server = net.createServer(socket => {
        sockets.add(socket);
        socket.on('close', () => sockets.delete(socket));
        socket.on('error', () => { });
        let buffer = '';
        socket.on('data', chunk => {
            buffer += chunk.toString();
            let index;
            while ((index = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, index);
                buffer = buffer.slice(index + 1);
                received.push(line);
                const reply = handler(line);
                if (reply === null) continue;
                const data = reply + '\n';
                if (mode === 'split') {
                    socket.write(data.slice(0, 3));
                    setTimeout(() => socket.write(data.slice(3)), 30);
                } else {
                    socket.write(data);
                }
            }
        });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    process.env.RECSERVER_PORT = String(server.address().port);
    return {
        received,
        port: server.address().port,
        setHandler: fn => { handler = fn; },
        close: () => new Promise(resolve => {
            sockets.forEach(s => s.destroy());
            server.close(resolve);
        }),
    };
};

// A port with nothing listening on it (connection refused).
const pointRecServerAtClosedPort = async () => {
    const server = net.createServer();
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    await new Promise(resolve => server.close(resolve));
    process.env.RECSERVER_PORT = String(port);
};

const registerAndLogin = async (app, username, extra = {}) => {
    const password = 'Passw0rd1';
    await request(app).post('/api/users').send({ username, password, name: username, ...extra });
    const res = await request(app).post('/api/tokens').send({ username, password });
    return { token: res.body.token, userId: res.body.userId };
};

const makeAdmin = async (app, username = 'admin') => {
    await request(app).post('/api/users').send({ username, password: 'Passw0rd1', name: 'Admin' });
    await mongoose.connection.db.collection('users').updateOne({ username }, { $set: { role: 'admin' } });
    const res = await request(app).post('/api/tokens').send({ username, password: 'Passw0rd1' });
    return { token: res.body.token, userId: res.body.userId };
};

const auth = token => ({ Authorization: `Bearer ${token}` });

module.exports = {
    startMongo, stopMongo, clearMongo,
    startFakeRecServer, pointRecServerAtClosedPort,
    registerAndLogin, makeAdmin, auth,
};
