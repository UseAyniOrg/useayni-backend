"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaAssetService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const class_validator_1 = require("class-validator");
const db_1 = require("../db");
const mediaAsset_1 = require("../models/mediaAsset");
const r2_1 = require("../lib/storage/r2");
const IMAGE_LIMIT_BYTES = 2 * 1024 * 1024;
const DOCUMENT_LIMIT_BYTES = 10 * 1024 * 1024;
const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024;
const MIME_EXTENSIONS = {
    'application/pdf': 'pdf',
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};
const MEDIA_CATEGORIES = new Set([
    'avatar',
    'logo',
    'event-cover',
    'event-banner',
    'event-map',
    'sponsor-art',
    'form-cover',
    'miscellaneous-cover',
    'org-home-banner',
    'org-home-card',
    'org-home-logo',
    'org-home-avatar',
    'document',
]);
let MediaAssetService = class MediaAssetService {
    async createUpload(organizationId, uploadedBy, dto, uploadedByAccountId) {
        const extension = MIME_EXTENSIONS[dto.mime_type];
        if (!MEDIA_CATEGORIES.has(dto.category) || !extension) {
            throw new common_1.BadRequestException('Categoria ou tipo de arquivo não permitido.');
        }
        if (dto.visibility !== undefined &&
            !Object.values(mediaAsset_1.MediaAssetVisibility).includes(dto.visibility)) {
            throw new common_1.BadRequestException('Visibilidade de mídia inválida.');
        }
        if (dto.category.startsWith('org-home-') && !dto.mime_type.startsWith('image/')) {
            throw new common_1.BadRequestException('A home aceita apenas imagens nesta categoria.');
        }
        if (!Number.isSafeInteger(dto.size_bytes) || dto.size_bytes <= 0) {
            throw new common_1.BadRequestException('Informe o tamanho válido do arquivo.');
        }
        const isImage = dto.mime_type.startsWith('image/');
        const maxBytes = isImage ? IMAGE_LIMIT_BYTES : DOCUMENT_LIMIT_BYTES;
        if (dto.size_bytes > maxBytes) {
            throw new common_1.BadRequestException(isImage
                ? 'Imagens devem ter no máximo 2 MB após a compressão.'
                : 'Documentos devem ter no máximo 10 MB.');
        }
        if (dto.mime_type === 'application/pdf' && dto.category !== 'document') {
            throw new common_1.BadRequestException('PDF só pode ser enviado na categoria documento.');
        }
        const runner = db_1.AppDataBase.createQueryRunner();
        await runner.connect();
        await runner.startTransaction();
        let asset;
        try {
            await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [organizationId]);
            const featureRows = (await runner.query(`SELECT config
         FROM organization_features
         WHERE organization_id = $1 AND feature_slug = 'media_storage' AND enabled = true`, [organizationId]));
            if (featureRows.length === 0) {
                throw new common_1.ForbiddenException('O armazenamento de mídia não está habilitado.');
            }
            const config = typeof featureRows[0].config === 'string'
                ? JSON.parse(featureRows[0].config)
                : featureRows[0].config;
            const quota = Number(config?.quota_bytes ?? DEFAULT_QUOTA_BYTES);
            if (!Number.isSafeInteger(quota) || quota <= 0) {
                throw new common_1.ForbiddenException('A cota de armazenamento desta organização está inválida.');
            }
            const [usage] = (await runner.query(`SELECT COALESCE(SUM(size_bytes), 0)::text AS used_bytes
         FROM media_assets
         WHERE organization_id = $1 AND status IN ('ACTIVE', 'PENDING')`, [organizationId]));
            if (Number(usage.used_bytes) + dto.size_bytes > quota) {
                throw new common_1.ForbiddenException('A cota de armazenamento desta organização foi atingida.');
            }
            const year = new Date().getUTCFullYear();
            const key = `org_${organizationId}/${dto.category}/${year}/${(0, crypto_1.randomUUID)()}.${extension}`;
            asset = runner.manager.getRepository(mediaAsset_1.MediaAsset).create({
                organization_id: organizationId,
                key,
                mime_type: dto.mime_type,
                size_bytes: String(dto.size_bytes),
                category: dto.category,
                visibility: dto.visibility ?? mediaAsset_1.MediaAssetVisibility.PRIVATE,
                uploaded_by: uploadedBy ?? null,
                uploaded_by_account_id: uploadedByAccountId ?? null,
                status: mediaAsset_1.MediaAssetStatus.PENDING,
            });
            asset = await runner.manager.getRepository(mediaAsset_1.MediaAsset).save(asset);
            await runner.commitTransaction();
        }
        catch (error) {
            await runner.rollbackTransaction();
            throw error;
        }
        finally {
            await runner.release();
        }
        return {
            asset_id: asset.id,
            expires_in: 300,
            headers: { 'Content-Type': asset.mime_type },
        };
    }
    async uploadContent(organizationId, assetId, body, mimeType, actorId, actorAccountId) {
        const asset = await this.findOrganizationAsset(organizationId, assetId);
        if (asset.status !== mediaAsset_1.MediaAssetStatus.PENDING) {
            throw new common_1.BadRequestException('Este upload não está aguardando conteúdo.');
        }
        if (asset.uploaded_by !== actorId &&
            (!actorAccountId || asset.uploaded_by_account_id !== actorAccountId)) {
            throw new common_1.ForbiddenException('Somente a pessoa que iniciou o upload pode enviar o arquivo.');
        }
        if (!Buffer.isBuffer(body) ||
            body.byteLength !== Number(asset.size_bytes) ||
            mimeType !== asset.mime_type) {
            throw new common_1.BadRequestException('O tamanho ou tipo do arquivo não corresponde ao upload autorizado.');
        }
        try {
            await (0, r2_1.writeObject)(organizationId, asset.key, asset.mime_type, body, asset.mime_type.startsWith('image/'));
        }
        catch {
            throw new common_1.ServiceUnavailableException('Não foi possível enviar o arquivo ao armazenamento.');
        }
        return this.confirmUpload(organizationId, assetId);
    }
    async confirmUpload(organizationId, assetId) {
        const asset = await this.findOrganizationAsset(organizationId, assetId);
        if (asset.status !== mediaAsset_1.MediaAssetStatus.PENDING) {
            throw new common_1.BadRequestException('Este upload não está aguardando confirmação.');
        }
        let object;
        try {
            object = await (0, r2_1.inspectObject)(organizationId, asset.key);
        }
        catch (error) {
            if (typeof error === 'object' &&
                error !== null &&
                '$metadata' in error &&
                typeof error.$metadata === 'object' &&
                error.$metadata !== null &&
                'httpStatusCode' in error.$metadata &&
                error.$metadata.httpStatusCode === 404) {
                throw new common_1.BadRequestException('O objeto ainda não está disponível no R2.');
            }
            throw new common_1.ServiceUnavailableException('Não foi possível confirmar o objeto no R2.');
        }
        if (object.sizeBytes !== Number(asset.size_bytes) ||
            object.mimeType !== asset.mime_type) {
            throw new common_1.BadRequestException('O tamanho ou tipo enviado não corresponde ao upload autorizado.');
        }
        const updated = (await db_1.AppDataBase.query(`UPDATE media_assets
       SET status = 'ACTIVE'
       WHERE id = $1 AND organization_id = $2 AND status = 'PENDING'
       RETURNING id`, [asset.id, organizationId]));
        if (updated.length === 0) {
            throw new common_1.BadRequestException('O upload foi removido ou confirmado em outra solicitação.');
        }
        return { asset_id: asset.id, status: mediaAsset_1.MediaAssetStatus.ACTIVE };
    }
    async getPrivateReadUrl(organizationId, assetId) {
        const asset = await this.findOrganizationAsset(organizationId, assetId);
        if (asset.status !== mediaAsset_1.MediaAssetStatus.ACTIVE) {
            throw new common_1.NotFoundException('Mídia não encontrada.');
        }
        return { url: await (0, r2_1.createPresignedRead)(organizationId, asset.key), expires_in: 600 };
    }
    async getPublicReadUrl(organizationId, assetId) {
        const asset = await this.findOrganizationAsset(organizationId, assetId);
        if (asset.status !== mediaAsset_1.MediaAssetStatus.ACTIVE ||
            asset.visibility !== mediaAsset_1.MediaAssetVisibility.PUBLIC ||
            !(await this.isReferencedByPublicContent(organizationId, assetId))) {
            throw new common_1.NotFoundException('Mídia pública não encontrada.');
        }
        return { url: await (0, r2_1.createPresignedRead)(organizationId, asset.key), expires_in: 600 };
    }
    async remove(organizationId, assetId) {
        const asset = await this.findOrganizationAsset(organizationId, assetId);
        if (asset.status !== mediaAsset_1.MediaAssetStatus.PENDING_DELETION) {
            asset.status = mediaAsset_1.MediaAssetStatus.PENDING_DELETION;
            await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).save(asset);
            await db_1.AppDataBase.query(`UPDATE miscellaneous
         SET cover_asset_id = CASE WHEN cover_asset_id = $1 THEN NULL ELSE cover_asset_id END,
             banner_asset_id = CASE WHEN banner_asset_id = $1 THEN NULL ELSE banner_asset_id END,
             map_asset_id = CASE WHEN map_asset_id = $1 THEN NULL ELSE map_asset_id END,
             sponsor_asset_ids = COALESCE((
               SELECT jsonb_agg(item.value)
               FROM jsonb_array_elements_text(sponsor_asset_ids) AS item(value)
               WHERE item.value <> $1::text
             ), '[]'::jsonb)
         WHERE organization_id = $2
           AND (cover_asset_id = $1 OR banner_asset_id = $1 OR map_asset_id = $1
                OR sponsor_asset_ids @> jsonb_build_array($1::text))`, [assetId, organizationId]);
        }
        try {
            await (0, r2_1.deleteObject)(organizationId, asset.key);
        }
        catch (error) {
            throw new common_1.ServiceUnavailableException('A mídia foi marcada para exclusão, mas não foi possível removê-la do R2. Tente novamente.');
        }
    }
    async cleanupAbandonedUploads() {
        const staleAssets = (await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset)
            .createQueryBuilder('asset')
            .where("(asset.status = :pending AND asset.created_at < now() - interval '1 hour') OR " +
            "(asset.status = :deletion AND asset.created_at < now() - interval '10 minutes')", { pending: mediaAsset_1.MediaAssetStatus.PENDING, deletion: mediaAsset_1.MediaAssetStatus.PENDING_DELETION })
            .getMany());
        for (const asset of staleAssets) {
            try {
                await (0, r2_1.deleteObject)(asset.organization_id, asset.key);
                if (asset.status === mediaAsset_1.MediaAssetStatus.PENDING) {
                    await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).delete({ id: asset.id });
                }
            }
            catch (error) {
                console.error(`[Media cleanup] Não foi possível remover o asset ${asset.id}.`, error);
            }
        }
    }
    async publicMiscellaneousMedia(organizationId, miscellaneousId) {
        const featureRows = (await db_1.AppDataBase.query(`SELECT enabled
       FROM organization_features
       WHERE organization_id = $1 AND feature_slug = 'media_storage'`, [organizationId]));
        if (featureRows[0]?.enabled !== true) {
            throw new common_1.ForbiddenException('O armazenamento de mídia não está habilitado.');
        }
        const rows = (await db_1.AppDataBase.query(`SELECT id, cover_asset_id, banner_asset_id, map_asset_id, sponsor_asset_ids
       FROM miscellaneous
       WHERE id = $1 AND organization_id = $2 AND status = 'active'
         AND public_access_enabled = true`, [miscellaneousId, organizationId]));
        if (rows.length === 0)
            throw new common_1.NotFoundException('Conteúdo público não encontrado.');
        const item = rows[0];
        return {
            cover_url: await this.optionalPublicUrl(organizationId, item.cover_asset_id),
            banner_url: await this.optionalPublicUrl(organizationId, item.banner_asset_id),
            map_url: await this.optionalPublicUrl(organizationId, item.map_asset_id),
            sponsor_urls: await Promise.all((item.sponsor_asset_ids ?? []).map((id) => this.getPublicReadUrl(organizationId, id))).then((results) => results.map(({ url }) => url)),
        };
    }
    async optionalPublicUrl(organizationId, id) {
        if (!id)
            return null;
        const result = await this.getPublicReadUrl(organizationId, id);
        return result.url;
    }
    async findOrganizationAsset(organizationId, assetId) {
        if (!(0, class_validator_1.isUUID)(assetId))
            throw new common_1.NotFoundException('Mídia não encontrada.');
        const asset = await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).findOne({
            where: { id: assetId, organization_id: organizationId },
        });
        if (!asset)
            throw new common_1.NotFoundException('Mídia não encontrada.');
        if (!asset.key.startsWith(`org_${organizationId}/`)) {
            throw new common_1.ForbiddenException('A mídia está fora do escopo desta organização.');
        }
        return asset;
    }
    async isReferencedByPublicContent(organizationId, assetId) {
        const rows = (await db_1.AppDataBase.query(`SELECT EXISTS (
         SELECT 1
         FROM miscellaneous AS misc
         WHERE misc.organization_id = $1
           AND misc.status = 'active'
           AND misc.public_access_enabled = true
           AND (
             misc.cover_asset_id = $2 OR misc.banner_asset_id = $2 OR misc.map_asset_id = $2
             OR misc.sponsor_asset_ids @> jsonb_build_array($2::text)
           )
         UNION ALL
         SELECT 1
         FROM forms AS form
         JOIN miscellaneous AS misc ON misc.id = form.miscellaneous_id
         WHERE misc.organization_id = $1
           AND misc.status = 'active'
           AND misc.public_access_enabled = true
           AND form.public_slug IS NOT NULL
           AND misc.cover_asset_id = $2
       ) AS visible`, [organizationId, assetId]));
        return rows[0]?.visible === true;
    }
};
exports.MediaAssetService = MediaAssetService;
exports.MediaAssetService = MediaAssetService = __decorate([
    (0, common_1.Injectable)()
], MediaAssetService);
