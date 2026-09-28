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
        fake = await startFakeRecServer(() => '200 Ok\ta b c');
        await expect(recClient.send('GET u m')).resolves.toEqual({ code: 200, reason: 'Ok', ids: ['a', 'b', 'c'] });
    });

    test('reassembles a reply split across TCP chunks', async () => {
        fake = await startFakeRecServer(() => '200 Ok\tx y', { mode: 'split' });
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
