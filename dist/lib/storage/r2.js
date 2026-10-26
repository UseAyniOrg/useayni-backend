"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeR2Storage = initializeR2Storage;
exports.createPresignedUpload = createPresignedUpload;
exports.writeObject = writeObject;
exports.createPresignedRead = createPresignedRead;
exports.inspectObject = inspectObject;
exports.deleteObject = deleteObject;
exports.readPublicObject = readPublicObject;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const IMAGE_CACHE_CONTROL = 'private, max-age=31536000, immutable';
let client;
let bucket;
function initializeR2Storage() {
    const required = [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET',
    ];
    const missing = required.filter((name) => !process.env[name]?.trim());
    if (missing.length > 0) {
        throw new Error(`Configuração R2 incompleta. Variáveis ausentes: ${missing.join(', ')}`);
    }
    const accountId = process.env.R2_ACCOUNT_ID.trim();
    bucket = process.env.R2_BUCKET.trim();
    client = new client_s3_1.S3Client({
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        region: 'auto',
        forcePathStyle: true,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
        },
    });
}
function getStorage() {
    if (!client || !bucket) {
        throw new Error('Storage R2 não inicializado. Inicialize-o durante o bootstrap do servidor.');
    }
    return { client, bucket };
}
function assertOrganizationKey(organizationId, key) {
    const prefix = `org_${organizationId}/`;
    if (!key.startsWith(prefix) ||
        key.includes('\\') ||
        key.split('/').some((segment) => segment === '..' || segment === '.')) {
        throw new Error('A chave do objeto não pertence à organização informada.');
    }
}
async function createPresignedUpload(organizationId, key, mimeType, sizeBytes, isImage) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    const command = new client_s3_1.PutObjectCommand({
        Bucket: storage.bucket,
        Key: key,
        ContentType: mimeType,
        ContentLength: sizeBytes,
        ...(isImage ? { CacheControl: IMAGE_CACHE_CONTROL } : {}),
    });
    return (0, s3_request_presigner_1.getSignedUrl)(storage.client, command, { expiresIn: 300 });
}
async function writeObject(organizationId, key, mimeType, body, isImage) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    await storage.client.send(new client_s3_1.PutObjectCommand({
        Bucket: storage.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
        ContentLength: body.byteLength,
        ...(isImage ? { CacheControl: IMAGE_CACHE_CONTROL } : {}),
    }));
}
async function createPresignedRead(organizationId, key) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    return (0, s3_request_presigner_1.getSignedUrl)(storage.client, new client_s3_1.GetObjectCommand({
        Bucket: storage.bucket,
        Key: key,
    }), { expiresIn: 600 });
}
async function inspectObject(organizationId, key) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    const result = await storage.client.send(new client_s3_1.HeadObjectCommand({ Bucket: storage.bucket, Key: key }));
    return { sizeBytes: result.ContentLength, mimeType: result.ContentType };
}
async function deleteObject(organizationId, key) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    await storage.client.send(new client_s3_1.DeleteObjectCommand({ Bucket: storage.bucket, Key: key }));
}
async function readPublicObject(organizationId, key) {
    assertOrganizationKey(organizationId, key);
    const storage = getStorage();
    const result = await storage.client.send(new client_s3_1.GetObjectCommand({ Bucket: storage.bucket, Key: key }));
    if (!result.Body) {
        throw new Error('O objeto público não possui conteúdo no R2.');
    }
    return { body: await result.Body.transformToByteArray() };
}
