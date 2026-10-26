"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTenantOrigin = isTenantOrigin;
function isTenantOrigin(origin, production = process.env.NODE_ENV === 'production') {
    let url;
    try {
        url = new URL(origin);
    }
    catch {
        return false;
    }
    if (url.origin !== origin)
        return false;
    const hostname = url.hostname.toLowerCase();
    const localTenant = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.localhost$/.test(hostname);
    if (!production && url.protocol === 'http:' &&
        (['localhost', '127.0.0.1', '[::1]'].includes(hostname) || localTenant))
        return true;
    const tenant = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.useayni\.com$/.exec(hostname);
    return url.protocol === 'https:' && Boolean(tenant) && !['www', 'admin', 'api'].includes(tenant?.[1] ?? '');
}
