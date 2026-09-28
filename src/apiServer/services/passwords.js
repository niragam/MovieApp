// Password hashing with Node's built-in crypto (scrypt), so no extra library is needed.
// Stored format: "scrypt$<salt hex>$<hash hex>".
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;
const PREFIX = 'scrypt$';

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, KEY_LENGTH);
    return `${PREFIX}${salt.toString('hex')}$${hash.toString('hex')}`;
};

const verifyPassword = async (password, stored) => {
    if (typeof stored !== 'string' || !stored.startsWith(PREFIX)) return false;
    const [saltHex, hashHex] = stored.slice(PREFIX.length).split('$');
    if (!saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await scrypt(password, Buffer.from(saltHex, 'hex'), expected.length);
    return crypto.timingSafeEqual(actual, expected); // constant-time comparison
};

const isHashed = (stored) => typeof stored === 'string' && stored.startsWith(PREFIX);

module.exports = { hashPassword, verifyPassword, isHashed };
