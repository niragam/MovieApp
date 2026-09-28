require('dotenv').config();
const mongoose = require('mongoose');
const { hashPassword, isHashed } = require('../services/passwords');

const hashPlaintextPasswords = async (db) => {
    const users = db.collection('users');
    let hashed = 0;
    for await (const user of users.find({}, { projection: { password: 1 } })) {
        if (isHashed(user.password)) continue;
        await users.updateOne({ _id: user._id }, { $set: { password: await hashPassword(String(user.password)) } });
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
