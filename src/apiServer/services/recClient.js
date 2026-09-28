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

const parseReply = (buffer, isGet) => {
    const lines = buffer.split('\n');
    if (lines.length < 2) return null;
    const status = parseStatus(lines[0]);
    if (!(isGet && status.code === 200)) {
        return { ...status, ids: [] };
    }
    if (lines.length < 4) return null;
    return { ...status, ids: lines[2].split(' ').filter(Boolean) };
};

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
