// Small shared validators used by the Mongoose schemas.
const isHttpUrl = value => {
    if (value === null || value === undefined || value === '') return true; // optional
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
};

const httpUrlField = label => ({
    type: String,
    default: null,
    trim: true,
    validate: { validator: isHttpUrl, message: `${label} must be an http(s) URL` },
});

// Escapes user input so it is matched literally inside a RegExp.
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { isHttpUrl, httpUrlField, escapeRegex };
