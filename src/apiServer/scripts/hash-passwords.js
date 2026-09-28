// One-off migration: hash any passwords still stored in plaintext.
// bcrypt hashes start with "$2"; anything else is treated as plaintext.
// Usage: MONGO_URI=mongodb://localhost:27017/netflix node src/apiServer/scripts/hash-passwords.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hashPlaintextPasswords = async (db) => {
    const users = db.collection('users');
    let hashed = 0;
    for await (const user of users.find({ password: { $not: /^\$2/ } })) {
        await users.updateOne({ _id: user._id }, { $set: { password: await bcrypt.hash(user.password, 10) } });
        hashed++;
    }
    return hashed;
};

if (require.main === module) {
    (async () => {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/netflix');
        console.log(`Hashed ${await hashPlaintextPasswords(mongoose.connection.db)} passwords`);
        await mongoose.disconnect();
    })().catch(error => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { hashPlaintextPasswords };
