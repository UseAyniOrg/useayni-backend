"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptEmailPayload = encryptEmailPayload;
exports.decryptEmailPayload = decryptEmailPayload;
const crypto_1 = require("crypto");
function encryptionKey(value) {
    const key = Buffer.from(value, 'base64');
    if (key.length !== 32)
        throw new Error('EMAIL_TOKEN_ENCRYPTION_KEY must contain 32 base64-encoded bytes');
    return key;
}
function encryptEmailPayload(value, secret) {
    const iv = (0, crypto_1.randomBytes)(12);
    const cipher = (0, crypto_1.createCipheriv)('aes-256-gcm', encryptionKey(secret), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}
function decryptEmailPayload(value, secret) {
    const buffer = Buffer.from(value, 'base64');
    const decipher = (0, crypto_1.createDecipheriv)('aes-256-gcm', encryptionKey(secret), buffer.subarray(0, 12));
    decipher.setAuthTag(buffer.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8'));
}
