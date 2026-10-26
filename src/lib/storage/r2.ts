import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const IMAGE_CACHE_CONTROL = 'private, max-age=31536000, immutable';
let client: S3Client | undefined;
let bucket: string | undefined;

export function initializeR2Storage(): void {
  const required = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET',
  ] as const;
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Configuração R2 incompleta. Variáveis ausentes: ${missing.join(', ')}`);
  }

  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  bucket = process.env.R2_BUCKET!.trim();
  client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

function getStorage(): { client: S3Client; bucket: string } {
  if (!client || !bucket) {
    throw new Error('Storage R2 não inicializado. Inicialize-o durante o bootstrap do servidor.');
  }
  return { client, bucket };
}

function assertOrganizationKey(organizationId: string, key: string): void {
  const prefix = `org_${organizationId}/`;
  if (
    !key.startsWith(prefix) ||
    key.includes('\\') ||
    key.split('/').some((segment) => segment === '..' || segment === '.')
  ) {
    throw new Error('A chave do objeto não pertence à organização informada.');
  }
}

export async function createPresignedUpload(
  organizationId: string,
  key: string,
  mimeType: string,
  sizeBytes: number,
  isImage: boolean,
): Promise<string> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  const command = new PutObjectCommand({
    Bucket: storage.bucket,
    Key: key,
    ContentType: mimeType,
    ContentLength: sizeBytes,
    ...(isImage ? { CacheControl: IMAGE_CACHE_CONTROL } : {}),
  });
  return getSignedUrl(storage.client, command, { expiresIn: 300 });
}

export async function writeObject(
  organizationId: string,
  key: string,
  mimeType: string,
  body: Buffer,
  isImage: boolean,
): Promise<void> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  await storage.client.send(new PutObjectCommand({
    Bucket: storage.bucket,
    Key: key,
    Body: body,
    ContentType: mimeType,
    ContentLength: body.byteLength,
    ...(isImage ? { CacheControl: IMAGE_CACHE_CONTROL } : {}),
  }));
}

export async function createPresignedRead(
  organizationId: string,
  key: string,
): Promise<string> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  return getSignedUrl(
    storage.client,
    new GetObjectCommand({
      Bucket: storage.bucket,
      Key: key,
    }),
    { expiresIn: 600 },
  );
}

export async function inspectObject(
  organizationId: string,
  key: string,
): Promise<{ sizeBytes?: number; mimeType?: string }> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  const result = await storage.client.send(
    new HeadObjectCommand({ Bucket: storage.bucket, Key: key }),
  );
  return { sizeBytes: result.ContentLength, mimeType: result.ContentType };
}

export async function deleteObject(organizationId: string, key: string): Promise<void> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  await storage.client.send(new DeleteObjectCommand({ Bucket: storage.bucket, Key: key }));
}

export async function readPublicObject(
  organizationId: string,
  key: string,
): Promise<{ body: Uint8Array }> {
  assertOrganizationKey(organizationId, key);
  const storage = getStorage();
  const result = await storage.client.send(
    new GetObjectCommand({ Bucket: storage.bucket, Key: key }),
  );
  if (!result.Body) {
    throw new Error('O objeto público não possui conteúdo no R2.');
  }
  return { body: await result.Body.transformToByteArray() };
}
