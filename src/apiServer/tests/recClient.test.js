const { startFakeRecServer, pointRecServerAtClosedPort } = require('./helpers');
const recClient = require('../services/recClient');

describe('recClient', () => {
    let fake;
    afterEach(async () => { if (fake) await fake.close(); fake = null; });

    test('parses a status-only reply', async () => {
        fake = await startFakeRecServer(() => '204 No Content');
        await expect(recClient.send('PATCH u m')).resolves.toEqual({ code: 204, reason: 'No Content', ids: [] });
        expect(fake.received).toEqual(['PATCH u m']);
    });

    test('parses GET ids after the tab', async () => {
        fake = await startFakeRecServer(() => '200 Ok\n\na b c');
        await expect(recClient.send('GET u m')).resolves.toEqual({ code: 200, reason: 'Ok', ids: ['a', 'b', 'c'] });
    });

    test('reassembles a reply split across TCP chunks', async () => {
        fake = await startFakeRecServer(() => '200 Ok\n\nx y', { mode: 'split' });
        await expect(recClient.send('GET u m')).resolves.toMatchObject({ code: 200, ids: ['x', 'y'] });
    });

    test('rejects when the server is unreachable', async () => {
        await pointRecServerAtClosedPort();
        await expect(recClient.send('GET u m')).rejects.toBeInstanceOf(recClient.RecServerError);
    });

    test('rejects after the timeout when the server never replies', async () => {
        fake = await startFakeRecServer(() => null);
        const started = Date.now();
        await expect(recClient.send('GET u m')).rejects.toThrow(/timed out/);
        expect(Date.now() - started).toBeLessThan(2000);
    });

    test('rejects a malformed reply', async () => {
        fake = await startFakeRecServer(() => 'garbage');
        await expect(recClient.send('GET u m')).rejects.toThrow(/Malformed/);
    });
});

describe('recClient reply framing', () => {
    let fake;
    afterEach(async () => { if (fake) await fake.close(); fake = null; });

    test('waits for the ids line of a GET even when it arrives later', async () => {
        fake = await startFakeRecServer(() => '200 Ok\n\na b', { mode: 'split' });
        await expect(recClient.send('GET u m')).resolves.toMatchObject({ code: 200, ids: ['a', 'b'] });
    });

    test('an empty GET result and a 404 GET are both single replies', async () => {
        fake = await startFakeRecServer(line => (line === 'GET known m' ? '200 Ok\n\n' : '404 Not Found'));
        await expect(recClient.send('GET known m')).resolves.toEqual({ code: 200, reason: 'Ok', ids: [] });
        await expect(recClient.send('GET ghost m')).resolves.toEqual({ code: 404, reason: 'Not Found', ids: [] });
    });

    test('parseReply needs the full GET body before resolving', () => {
        expect(recClient.parseReply('200 Ok\n\n12 1', true)).toBeNull();
        expect(recClient.parseReply('200 Ok\n\n12 13\n', true).ids).toEqual(['12', '13']);
        expect(recClient.parseReply('204 No Content\n', false).code).toBe(204);
    });
});
