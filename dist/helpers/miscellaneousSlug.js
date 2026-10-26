"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMiscellaneousPublicSlug = generateMiscellaneousPublicSlug;
function generateMiscellaneousPublicSlug(title, suffix) {
    const base = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '');
    return `${base || 'evento'}-${suffix}`;
}
