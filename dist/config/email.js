"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailConfig = emailConfig;
exports.emailActionUrl = emailActionUrl;
exports.emailTenantUrl = emailTenantUrl;
function emailConfig() {
    const provider = process.env.EMAIL_PROVIDER ?? 'mock';
    if (!['mock', 'brevo'].includes(provider))
        throw new Error('EMAIL_PROVIDER must be mock or brevo');
    const budget = Number(process.env.EMAIL_DAILY_BUDGET ?? 300);
    if (!Number.isInteger(budget) || budget < 1)
        throw new Error('Invalid EMAIL_DAILY_BUDGET');
    const publicUrl = new URL(process.env.PUBLIC_APP_URL ?? (process.env.NODE_ENV === 'production' ? 'https://www.useayni.com' : 'http://localhost:5173'));
    if (process.env.NODE_ENV === 'production' && publicUrl.protocol !== 'https:') {
        throw new Error('PUBLIC_APP_URL must use HTTPS in production');
    }
    return {
        provider,
        enabled: process.env.EMAIL_WORKER_ENABLED === 'true',
        budget,
        apiKey: process.env.BREVO_API_KEY ?? '',
        encryptionKey: process.env.EMAIL_TOKEN_ENCRYPTION_KEY ?? '',
        webhookSecret: process.env.EMAIL_WEBHOOK_SECRET ?? '',
        publicUrl,
        publicApiUrl: new URL(process.env.PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? 'https://api.useayni.com' : 'http://localhost:3333')),
        tenantDomain: process.env.TENANT_BASE_DOMAIN ?? 'useayni.com',
        allowlist: (process.env.EMAIL_TEST_RECIPIENT_ALLOWLIST ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean),
    };
}
function emailActionUrl(path, token) {
    const url = new URL(path, emailConfig().publicUrl);
    url.hash = new URLSearchParams({ token }).toString();
    return url.toString();
}
function emailTenantUrl(slug, path) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
        throw new Error('Invalid tenant slug');
    const config = emailConfig();
    const url = new URL(path, config.publicUrl);
    if (process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1'].includes(config.publicUrl.hostname)) {
        url.pathname = `/o/${slug}${url.pathname}`;
    }
    else {
        url.hostname = `${slug}.${config.tenantDomain}`;
        url.protocol = 'https:';
        url.port = '';
    }
    return url.toString();
}
