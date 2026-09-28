// Client for the C++ recommendation server.
//
// Protocol: one request line per command ("PATCH <userId> <movieId>...\n"); the server
// answers with exactly one line: "<code> <reason>", where a successful GET appends
// "\t<id1> <id2> ...". TCP is a byte stream, so the reply is buffered until the newline.
const net = require('net');

class RecServerError extends Error {
    constructor(message) {
        super(message);
        this.name = 'RecServerError';
    }
}

const config = () => ({
    host: process.env.RECSERVER_HOST || 'recserver',
    port: Number(process.env.RECSERVER_PORT) || 8000,
    timeoutMs: Number(process.env.RECSERVER_TIMEOUT_MS) || 3000,
});

const parseReply = (line) => {
    const [status, payload = ''] = line.split('\t');
    const match = /^(\d{3}) (.+)$/.exec(status);
    if (!match) {
        throw new RecServerError(`Malformed reply from recommendation server: ${JSON.stringify(line)}`);
    }
    return {
        code: Number(match[1]),
        reason: match[2],
        ids: payload.split(' ').filter(Boolean),
    };
};

// Sends one command and resolves with { code, reason, ids }.
// Rejects with RecServerError if the server is unreachable, silent, or replies garbage.
const send = (command) => {
    const { host, port, timeoutMs } = config();
    return new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port });
        let buffer = '';
        let settled = false;

        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            socket.destroy();
            if (error) reject(error);
            else resolve(value);
        };

        socket.setTimeout(timeoutMs, () =>
            finish(new RecServerError(`Recommendation server timed out after ${timeoutMs}ms`)));
        socket.on('error', (err) =>
            finish(new RecServerError(`Recommendation server unavailable: ${err.code || err.message}`)));
        socket.on('connect', () => socket.write(`${command}\n`));
        socket.on('data', (chunk) => {
            buffer += chunk.toString();
            const newline = buffer.indexOf('\n');
            if (newline === -1) return;
            try {
                finish(null, parseReply(buffer.slice(0, newline)));
            } catch (err) {
                finish(err);
            }
        });
        socket.on('close', () =>
            finish(new RecServerError('Recommendation server closed the connection without replying')));
    });
};

module.exports = { send, RecServerError, parseReply };
