// Client for the C++ recommendation server.
//
// Protocol (assignment part 2): one request line per command ("PATCH <userId> <movieId>...\n").
// Every reply ends with a newline. Replies are one status line ("204 No Content"), except a
// successful GET: "200 Ok", an empty line, then one line of space-separated movie ids.
// TCP is a byte stream, so the reply is buffered until all of its lines have arrived.
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

const parseStatus = (line) => {
    const match = /^(\d{3}) (.+)$/.exec(line);
    if (!match) {
        throw new RecServerError(`Malformed reply from recommendation server: ${JSON.stringify(line)}`);
    }
    return { code: Number(match[1]), reason: match[2] };
};

// Returns the parsed reply once `buffer` holds a complete one, otherwise null.
// `isGet` tells whether a 200 reply carries the two extra lines (blank + ids).
const parseReply = (buffer, isGet) => {
    const lines = buffer.split('\n');
    if (lines.length < 2) return null; // status line not complete yet
    const status = parseStatus(lines[0]);
    if (!(isGet && status.code === 200)) {
        return { ...status, ids: [] };
    }
    if (lines.length < 4) return null; // blank line and ids line not complete yet
    return { ...status, ids: lines[2].split(' ').filter(Boolean) };
};

// Sends one command and resolves with { code, reason, ids }.
// Rejects with RecServerError if the server is unreachable, silent, or replies garbage.
const send = (command) => {
    const { host, port, timeoutMs } = config();
    const isGet = command.startsWith('GET ');
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
            try {
                const reply = parseReply(buffer, isGet);
                if (reply) finish(null, reply);
            } catch (err) {
                finish(err);
            }
        });
        socket.on('close', () =>
            finish(new RecServerError('Recommendation server closed the connection without replying')));
    });
};

module.exports = { send, RecServerError, parseReply };
