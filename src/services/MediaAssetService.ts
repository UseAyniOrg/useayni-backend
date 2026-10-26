import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { isUUID } from 'class-validator';
import { AppDataBase } from '../db';
import {
  MediaAsset,
  MediaAssetStatus,
  MediaAssetVisibility,
} from '../models/mediaAsset';
import {
  createPresignedRead,
  writeObject,
  deleteObject,
  inspectObject,
} from '../lib/storage/r2';

const IMAGE_LIMIT_BYTES = 2 * 1024 * 1024;
const DOCUMENT_LIMIT_BYTES = 10 * 1024 * 1024;
const DEFAULT_QUOTA_BYTES = 1024 * 1024 * 1024;

const MIME_EXTENSIONS: Record<string, string> = {
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

interface CreateUploadDto {
  category: string;
  mime_type: string;
  size_bytes: number;
  visibility?: MediaAssetVisibility;
}

@Injectable()
export class MediaAssetService {
  async createUpload(
    organizationId: string,
    uploadedBy: string | undefined,
    dto: CreateUploadDto,
    uploadedByAccountId?: string,
  ) {
    const extension = MIME_EXTENSIONS[dto.mime_type];
    if (!MEDIA_CATEGORIES.has(dto.category) || !extension) {
      throw new BadRequestException('Categoria ou tipo de arquivo não permitido.');
    }
    if (
      dto.visibility !== undefined &&
      !Object.values(MediaAssetVisibility).includes(dto.visibility)
    ) {
      throw new BadRequestException('Visibilidade de mídia inválida.');
    }
    if (dto.category.startsWith('org-home-') && !dto.mime_type.startsWith('image/')) {
      throw new BadRequestException('A home aceita apenas imagens nesta categoria.');
    }
    if (!Number.isSafeInteger(dto.size_bytes) || dto.size_bytes <= 0) {
      throw new BadRequestException('Informe o tamanho válido do arquivo.');
    }
    const isImage = dto.mime_type.startsWith('image/');
    const maxBytes = isImage ? IMAGE_LIMIT_BYTES : DOCUMENT_LIMIT_BYTES;
    if (dto.size_bytes > maxBytes) {
      throw new BadRequestException(
        isImage
          ? 'Imagens devem ter no máximo 2 MB após a compressão.'
          : 'Documentos devem ter no máximo 10 MB.',
      );
    }
    if (dto.mime_type === 'application/pdf' && dto.category !== 'document') {
      throw new BadRequestException('PDF só pode ser enviado na categoria documento.');
    }

    const runner = AppDataBase.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    let asset: MediaAsset;
    try {
      await runner.query('SELECT pg_advisory_xact_lock(hashtext($1))', [organizationId]);
      const featureRows = (await runner.query(
        `SELECT config
         FROM organization_features
         WHERE organization_id = $1 AND feature_slug = 'media_storage' AND enabled = true`,
        [organizationId],
      )) as { config: Record<string, unknown> | string }[];
      if (featureRows.length === 0) {
        throw new ForbiddenException('O armazenamento de mídia não está habilitado.');
      }

      const config = typeof featureRows[0].config === 'string'
        ? JSON.parse(featureRows[0].config)
        : featureRows[0].config;
      const quota = Number(config?.quota_bytes ?? DEFAULT_QUOTA_BYTES);
      if (!Number.isSafeInteger(quota) || quota <= 0) {
        throw new ForbiddenException('A cota de armazenamento desta organização está inválida.');
      }
      const [usage] = (await runner.query(
        `SELECT COALESCE(SUM(size_bytes), 0)::text AS used_bytes
         FROM media_assets
         WHERE organization_id = $1 AND status IN ('ACTIVE', 'PENDING')`,
        [organizationId],
      )) as { used_bytes: string }[];
      if (Number(usage.used_bytes) + dto.size_bytes > quota) {
        throw new ForbiddenException('A cota de armazenamento desta organização foi atingida.');
      }

      const year = new Date().getUTCFullYear();
      const key = `org_${organizationId}/${dto.category}/${year}/${randomUUID()}.${extension}`;
      asset = runner.manager.getRepository(MediaAsset).create({
        organization_id: organizationId,
        key,
        mime_type: dto.mime_type,
        size_bytes: String(dto.size_bytes),
        category: dto.category,
        visibility: dto.visibility ?? MediaAssetVisibility.PRIVATE,
        uploaded_by: uploadedBy ?? null,
        uploaded_by_account_id: uploadedByAccountId ?? null,
        status: MediaAssetStatus.PENDING,
      });
      asset = await runner.manager.getRepository(MediaAsset).save(asset);
      await runner.commitTransaction();
    } catch (error) {
      await runner.rollbackTransaction();
      throw error;
    } finally {
      await runner.release();
    }

    return {
      asset_id: asset.id,
      expires_in: 300,
      headers: { 'Content-Type': asset.mime_type },
    };
  }

  async uploadContent(
    organizationId: string,
    assetId: string,
    body: Buffer,
    mimeType: string,
    actorId: string,
    actorAccountId?: string,
  ) {
    const asset = await this.findOrganizationAsset(organizationId, assetId);
    if (asset.status !== MediaAssetStatus.PENDING) {
      throw new BadRequestException('Este upload não está aguardando conteúdo.');
    }
    if (asset.uploaded_by !== actorId &&
      (!actorAccountId || asset.uploaded_by_account_id !== actorAccountId)) {
      throw new ForbiddenException('Somente a pessoa que iniciou o upload pode enviar o arquivo.');
    }
    if (
      !Buffer.isBuffer(body) ||
      body.byteLength !== Number(asset.size_bytes) ||
      mimeType !== asset.mime_type
    ) {
      throw new BadRequestException('O tamanho ou tipo do arquivo não corresponde ao upload autorizado.');
    }

    try {
      await writeObject(organizationId, asset.key, asset.mime_type, body, asset.mime_type.startsWith('image/'));
    } catch {
      throw new ServiceUnavailableException('Não foi possível enviar o arquivo ao armazenamento.');
    }
    return this.confirmUpload(organizationId, assetId);
  }

  async confirmUpload(organizationId: string, assetId: string) {
    const asset = await this.findOrganizationAsset(organizationId, assetId);
    if (asset.status !== MediaAssetStatus.PENDING) {
      throw new BadRequestException('Este upload não está aguardando confirmação.');
    }

    let object: { sizeBytes?: number; mimeType?: string };
    try {
      object = await inspectObject(organizationId, asset.key);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        '$metadata' in error &&
        typeof error.$metadata === 'object' &&
        error.$metadata !== null &&
        'httpStatusCode' in error.$metadata &&
        error.$metadata.httpStatusCode === 404
      ) {
        throw new BadRequestException('O objeto ainda não está disponível no R2.');
      }
      throw new ServiceUnavailableException('Não foi possível confirmar o objeto no R2.');
    }
    if (
      object.sizeBytes !== Number(asset.size_bytes) ||
      object.mimeType !== asset.mime_type
    ) {
      throw new BadRequestException('O tamanho ou tipo enviado não corresponde ao upload autorizado.');
    }

    const updated = (await AppDataBase.query(
      `UPDATE media_assets
       SET status = 'ACTIVE'
       WHERE id = $1 AND organization_id = $2 AND status = 'PENDING'
       RETURNING id`,
      [asset.id, organizationId],
    )) as { id: string }[];
    if (updated.length === 0) {
      throw new BadRequestException('O upload foi removido ou confirmado em outra solicitação.');
    }
    return { asset_id: asset.id, status: MediaAssetStatus.ACTIVE };
  }

  async getPrivateReadUrl(organizationId: string, assetId: string) {
    const asset = await this.findOrganizationAsset(organizationId, assetId);
    if (asset.status !== MediaAssetStatus.ACTIVE) {
      throw new NotFoundException('Mídia não encontrada.');
    }
    return { url: await createPresignedRead(organizationId, asset.key), expires_in: 600 };
  }

  async getPublicReadUrl(organizationId: string, assetId: string) {
    const asset = await this.findOrganizationAsset(organizationId, assetId);
    if (
      asset.status !== MediaAssetStatus.ACTIVE ||
      asset.visibility !== MediaAssetVisibility.PUBLIC ||
      !(await this.isReferencedByPublicContent(organizationId, assetId))
    ) {
      throw new NotFoundException('Mídia pública não encontrada.');
    }
    return { url: await createPresignedRead(organizationId, asset.key), expires_in: 600 };
  }

  async remove(organizationId: string, assetId: string): Promise<void> {
    const asset = await this.findOrganizationAsset(organizationId, assetId);
    if (asset.status !== MediaAssetStatus.PENDING_DELETION) {
      asset.status = MediaAssetStatus.PENDING_DELETION;
      await AppDataBase.getRepository(MediaAsset).save(asset);

      await AppDataBase.query(
        `UPDATE miscellaneous
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
                OR sponsor_asset_ids @> jsonb_build_array($1::text))`,
        [assetId, organizationId],
      );
    }
    try {
      await deleteObject(organizationId, asset.key);
    } catch (error) {
      throw new ServiceUnavailableException(
        'A mídia foi marcada para exclusão, mas não foi possível removê-la do R2. Tente novamente.',
      );
    }
  }

  async cleanupAbandonedUploads(): Promise<void> {
    const staleAssets = (await AppDataBase.getRepository(MediaAsset)
      .createQueryBuilder('asset')
      .where(
        "(asset.status = :pending AND asset.created_at < now() - interval '1 hour') OR " +
          "(asset.status = :deletion AND asset.created_at < now() - interval '10 minutes')",
        { pending: MediaAssetStatus.PENDING, deletion: MediaAssetStatus.PENDING_DELETION },
      )
      .getMany());

    for (const asset of staleAssets) {
      try {
        await deleteObject(asset.organization_id, asset.key);
        if (asset.status === MediaAssetStatus.PENDING) {
          await AppDataBase.getRepository(MediaAsset).delete({ id: asset.id });
        }
      } catch (error) {
        console.error(`[Media cleanup] Não foi possível remover o asset ${asset.id}.`, error);
      }
    }
  }

  async publicMiscellaneousMedia(organizationId: string, miscellaneousId: string) {
    const featureRows = (await AppDataBase.query(
      `SELECT enabled
       FROM organization_features
       WHERE organization_id = $1 AND feature_slug = 'media_storage'`,
      [organizationId],
    )) as { enabled: boolean }[];
    if (featureRows[0]?.enabled !== true) {
      throw new ForbiddenException('O armazenamento de mídia não está habilitado.');
    }
    const rows = (await AppDataBase.query(
      `SELECT id, cover_asset_id, banner_asset_id, map_asset_id, sponsor_asset_ids
       FROM miscellaneous
       WHERE id = $1 AND organization_id = $2 AND status = 'active'
         AND public_access_enabled = true`,
      [miscellaneousId, organizationId],
    )) as {
      id: string;
      cover_asset_id: string | null;
      banner_asset_id: string | null;
      map_asset_id: string | null;
      sponsor_asset_ids: string[];
    }[];
    if (rows.length === 0) throw new NotFoundException('Conteúdo público não encontrado.');
    const item = rows[0];
    return {
      cover_url: await this.optionalPublicUrl(organizationId, item.cover_asset_id),
      banner_url: await this.optionalPublicUrl(organizationId, item.banner_asset_id),
      map_url: await this.optionalPublicUrl(organizationId, item.map_asset_id),
      sponsor_urls: await Promise.all(
        (item.sponsor_asset_ids ?? []).map((id) => this.getPublicReadUrl(organizationId, id)),
      ).then((results) => results.map(({ url }) => url)),
    };
  }

  private async optionalPublicUrl(organizationId: string, id: string | null) {
    if (!id) return null;
    const result = await this.getPublicReadUrl(organizationId, id);
    return result.url;
  }

  private async findOrganizationAsset(organizationId: string, assetId: string) {
    if (!isUUID(assetId)) throw new NotFoundException('Mídia não encontrada.');
    const asset = await AppDataBase.getRepository(MediaAsset).findOne({
      where: { id: assetId, organization_id: organizationId },
    });
    if (!asset) throw new NotFoundException('Mídia não encontrada.');
    if (!asset.key.startsWith(`org_${organizationId}/`)) {
      throw new ForbiddenException('A mídia está fora do escopo desta organização.');
    }
    return asset;
  }

  private async isReferencedByPublicContent(
    organizationId: string,
    assetId: string,
  ): Promise<boolean> {
    const rows = (await AppDataBase.query(
      `SELECT EXISTS (
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
       ) AS visible`,
      [organizationId, assetId],
    )) as { visible: boolean }[];
    return rows[0]?.visible === true;
  }
}
