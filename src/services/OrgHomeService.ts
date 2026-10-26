import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { EntityManager, In } from 'typeorm';
import { z } from 'zod';
import { AppDataBase } from '../db';
import {
  defaultOrgHomeSections,
  OrgHomeSectionType,
  ORG_HOME_SECTION_TYPES,
  validateOrgHomeSectionConfig,
} from '../config/orgHomeSections';
import { MediaAsset, MediaAssetStatus, MediaAssetVisibility } from '../models/mediaAsset';
import { Organization, OrganizationStatus } from '../models/organization';
import { OrgHomeConfig, OrgHomeStatus } from '../models/orgHomeConfig';
import { OrgHomeSection } from '../models/orgHomeSection';
import { readPublicObject } from '../lib/storage/r2';

const optionalText = z.string().trim().max(2000).optional();
const httpsUrl = z.string().trim().url().refine((value) => value.startsWith('https://'));

const configInputSchema = z.object({
  theme: z.object({
    primary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
    secondary_color: z.string().regex(/^#[0-9a-f]{6}$/i),
    background_color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    logo_background_color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    logo_asset_id: z.string().uuid().nullable().optional(),
    favicon_asset_id: z.string().uuid().nullable().optional(),
    font_family: z.enum(['Inter', 'Lato', 'Poppins']).optional(),
  }).strict(),
  seo: z.object({
    title: optionalText,
    description: optionalText,
    og_image_asset_id: z.string().uuid().nullable().optional(),
  }).strict(),
  social_links: z.object({
    instagram: httpsUrl.optional(),
    linkedin: httpsUrl.optional(),
    facebook: httpsUrl.optional(),
    youtube: httpsUrl.optional(),
    tiktok: httpsUrl.optional(),
  }).strict(),
  contact: z.object({
    address: optionalText,
    phone: z.string().trim().max(40).optional(),
    whatsapp: z.string().trim().max(40).optional(),
    email: z.string().trim().email().max(255).optional(),
    map_url: httpsUrl.optional(),
  }).strict(),
  sections: z.array(z.object({
    id: z.string().uuid().optional(),
    type: z.enum(ORG_HOME_SECTION_TYPES),
    order_index: z.number().int().min(0).max(1000),
    enabled: z.boolean(),
    title: z.string().trim().max(255),
    subtitle: z.string().trim().max(500),
    config: z.record(z.string(), z.unknown()),
  }).strict()).min(1).max(18),
}).strict();

type ConfigInput = z.infer<typeof configInputSchema>;
type PublicContentItem = {
  id: string;
  title: string;
  description: string;
  start_date?: Date | string;
  end_date?: Date | string | null;
  location_city?: string | null;
  location_state?: string | null;
  public_slug?: string | null;
  cover_asset_id?: string | null;
  cover_url?: string;
};

interface CachedHome {
  expires_at: number;
  data: Record<string, unknown>;
}

@Injectable()
export class OrgHomeService {
  private readonly publicCache = new Map<string, CachedHome>();

  async ensureDefaultHome(organizationId: string, transactionManager?: EntityManager): Promise<void> {
    const initialize = async (manager: EntityManager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [organizationId]);
      const organization = await manager.getRepository(Organization).findOneBy({ id: organizationId });
      if (!organization) throw new NotFoundException('Organização não encontrada.');
      const settings = organization.settings ?? {};
      const publicHome =
        typeof settings.public_home === 'object' && settings.public_home !== null
          ? settings.public_home as Record<string, unknown>
          : {};
      const publicTitle = typeof publicHome.title === 'string' ? publicHome.title.trim() : '';
      const publicDescription =
        typeof publicHome.description === 'string' ? publicHome.description.trim() : '';
      const configuredPrimaryColor =
        typeof organization.theme.primary_color === 'string' &&
        /^#[0-9a-f]{6}$/i.test(organization.theme.primary_color)
          ? organization.theme.primary_color
          : '#0e79b2';
      const configRepo = manager.getRepository(OrgHomeConfig);
      const config = await configRepo.findOneBy({ organization_id: organizationId });
      if (!config) {
        await configRepo.save(configRepo.create({
          organization_id: organizationId,
          status: OrgHomeStatus.PUBLISHED,
          theme: {
            primary_color: configuredPrimaryColor,
            secondary_color: '#0d1b2a',
            background_color: '#020617',
            logo_background_color: '#0d1b2a',
            font_family: 'Inter',
          },
          seo: {},
          social_links: {},
          contact: {},
        }));
      }

      const sectionRepo = manager.getRepository(OrgHomeSection);
      const count = await sectionRepo.countBy({ organization_id: organizationId });
      if (count === 0) {
        const template = defaultOrgHomeSections();
        const hero = template.find((section) => section.type === 'HERO');
        if (hero && (publicTitle || publicDescription)) {
          hero.title = publicTitle;
          hero.subtitle = publicDescription;
          const slides = hero.config.slides as Array<Record<string, unknown>>;
          slides[0] = {
            ...slides[0],
            title: publicTitle || slides[0].title,
            description: publicDescription || slides[0].description,
          };
        }
        await sectionRepo.save(template.map((section) =>
          sectionRepo.create({ ...section, organization_id: organizationId }),
        ));
      }
    };
    if (transactionManager) await initialize(transactionManager);
    else await AppDataBase.transaction(initialize);
  }

  async getEditorConfig(organizationId: string) {
    await this.findOrganization(organizationId);
    await this.ensureDefaultHome(organizationId);
    const [config, sections] = await Promise.all([
      AppDataBase.getRepository(OrgHomeConfig).findOneBy({ organization_id: organizationId }),
      AppDataBase.getRepository(OrgHomeSection).find({
        where: { organization_id: organizationId },
        order: { order_index: 'ASC' },
      }),
    ]);
    if (!config) throw new InternalServerErrorException('A configuração da home não foi inicializada.');
    return { config, sections };
  }

  async saveDraft(organizationId: string, actorId: string, input: unknown) {
    await this.findOrganization(organizationId);
    const parsed = configInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'A configuração da home contém dados inválidos.',
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    this.validateSections(parsed.data.sections);
    await this.validatePublicAssetReferences(organizationId, parsed.data);
    await this.ensureDefaultHome(organizationId);

    const savedConfig = await AppDataBase.transaction(async (manager) => {
      const configRepo = manager.getRepository(OrgHomeConfig);
      const current = await configRepo.findOneBy({ organization_id: organizationId });
      if (!current) throw new InternalServerErrorException('Configuração da home não encontrada.');
      Object.assign(current, {
        theme: {
          ...parsed.data.theme,
          background_color: parsed.data.theme.background_color ?? current.theme.background_color ?? '#020617',
          logo_background_color: parsed.data.theme.logo_background_color ?? current.theme.logo_background_color ?? '#0d1b2a',
        },
        seo: parsed.data.seo,
        social_links: parsed.data.social_links,
        contact: parsed.data.contact,
        status: OrgHomeStatus.DRAFT,
        updated_by: actorId,
      });
      const saved = await configRepo.save(current);

      const sectionRepo = manager.getRepository(OrgHomeSection);
      await sectionRepo.delete({ organization_id: organizationId });
      await sectionRepo.save(parsed.data.sections.map((section) =>
        sectionRepo.create({
          organization_id: organizationId,
          type: section.type,
          order_index: section.order_index,
          enabled: section.enabled,
          title: section.title,
          subtitle: section.subtitle,
          config: section.config,
          updated_by: actorId,
        }),
      ));
      return saved;
    });
    this.revalidate(organizationId);
    return { config: savedConfig, sections: parsed.data.sections };
  }

  async publish(organizationId: string, actorId: string) {
    await this.ensureDefaultHome(organizationId);
    const [config, sections] = await Promise.all([
      AppDataBase.getRepository(OrgHomeConfig).findOneBy({ organization_id: organizationId }),
      AppDataBase.getRepository(OrgHomeSection).findBy({ organization_id: organizationId }),
    ]);
    if (!config) throw new InternalServerErrorException('Configuração da home não encontrada.');
    if (sections.length === 0) throw new BadRequestException('Adicione pelo menos uma seção à home.');
    this.validateSections(sections);
    await this.validatePublicAssetReferences(organizationId, {
      theme: config.theme,
      seo: config.seo,
      social_links: config.social_links,
      contact: config.contact,
      sections,
    });

    config.status = OrgHomeStatus.PUBLISHED;
    config.published_at = new Date();
    config.updated_by = actorId;
    const saved = await AppDataBase.getRepository(OrgHomeConfig).save(config);
    this.revalidate(organizationId);
    return saved;
  }

  async getPublicHome(slug: string) {
    const organization = await AppDataBase.getRepository(Organization).findOne({
      where: { slug },
    });
    if (!organization || ![OrganizationStatus.ACTIVE, OrganizationStatus.TRIAL].includes(organization.status)) {
      throw new NotFoundException('Página da organização não encontrada.');
    }

    await this.ensureDefaultHome(organization.id);
    const cached = this.publicCache.get(organization.id);
    if (cached && cached.expires_at > Date.now()) return cached.data;

    const [config, sections] = await Promise.all([
      AppDataBase.getRepository(OrgHomeConfig).findOneBy({ organization_id: organization.id }),
      AppDataBase.getRepository(OrgHomeSection).find({
        where: { organization_id: organization.id, enabled: true },
        order: { order_index: 'ASC' },
      }),
    ]);
    if (!config || config.status !== OrgHomeStatus.PUBLISHED) {
      throw new NotFoundException('Página pública ainda não publicada.');
    }

    const featureRows = (await AppDataBase.query(
      `SELECT feature_slug
       FROM organization_features
       WHERE organization_id = $1 AND enabled = true`,
      [organization.id],
    )) as { feature_slug: string }[];
    const features = new Set(featureRows.map((row) => row.feature_slug));
    const publicHomeSections: Record<string, unknown>[] = [];

    for (const section of sections) {
      if (section.type === 'PARCEIROS' && !features.has('sponsors')) continue;
      if (section.type === 'TALENTOS' && !features.has('talent_network')) continue;

      const validated = validateOrgHomeSectionConfig(section.type, section.config);
      if (!validated.success) {
        throw new InternalServerErrorException(`Configuração inválida na seção ${section.type}.`);
      }
      const sectionData: Record<string, unknown> = {
        id: section.id,
        type: section.type,
        order_index: section.order_index,
        title: section.title,
        subtitle: section.subtitle,
        config: validated.data,
      };

      if (section.type === 'AGENDA' || section.type === 'NOTICIAS') {
        if (!features.has('miscellaneous_full') || !features.has('miscellaneous_public')) continue;
        const content = await this.getPublicMiscellaneous(
          organization.id,
          section.type,
          validated.data as { limit: number; manual_highlight_ids: string[] },
        );
        if (content.length === 0) continue;
        sectionData.items = content;
      } else if (section.type === 'NUMEROS') {
        const numbers = [...(validated.data.items as { label: string; value?: string; key?: string }[])];
        if (validated.data.include_member_count === true) {
          const [row] = await AppDataBase.query(
            `SELECT COUNT(*)::int AS total
             FROM members
             WHERE organization_id = $1 AND registration_status = 'approved'`,
            [organization.id],
          ) as { total: number }[];
          numbers.push({ label: 'Membros', value: String(row.total) });
        } else {
          for (let i = numbers.length - 1; i >= 0; i -= 1) {
            if (numbers[i].key === 'members') numbers.splice(i, 1);
          }
        }
        if (numbers.length === 0) continue;
        sectionData.config = { ...validated.data, items: numbers };
      } else if (section.type === 'PARCEIROS') {
        const items = await this.hydratePartnerLogos(organization.id, validated.data.items as {
          name: string;
          logo_asset_id?: string;
          image_alt?: string;
          url?: string;
        }[]);
        if (items.length === 0) continue;
        sectionData.config = { ...validated.data, items };
      } else if (section.type === 'TALENTOS') {
        sectionData.show_button = features.has('talent_network');
      } else if (section.type === 'HERO') {
        sectionData.config = {
          ...validated.data,
          slides: await this.hydrateHeroSlides(organization.id, validated.data.slides as {
            title: string;
            description?: string;
            image_asset_id?: string;
            image_alt?: string;
            video_url?: string;
            button_text?: string;
            button_url?: string;
          }[]),
        };
        if ((sectionData.config as { slides: unknown[] }).slides.length === 0) continue;
      } else if (section.type === 'CAMINHOS' || section.type === 'VANTAGENS') {
        if ((validated.data.items as unknown[]).length === 0) continue;
      } else if (section.type === 'CONTATO') {
        const hasContact = Object.values(config.contact ?? {}).some((value) => Boolean(value)) ||
          Object.values(config.social_links ?? {}).some((value) => Boolean(value));
        if (!hasContact) continue;
      }

      publicHomeSections.push(sectionData);
    }

    const result: Record<string, unknown> = {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
      },
      config: {
        theme: await this.hydrateTheme(organization.id, config.theme),
        seo: await this.hydrateSeo(organization.id, config.seo),
        social_links: config.social_links,
        contact: config.contact,
        published_at: config.published_at,
      },
      sections: publicHomeSections,
      features: [...features],
    };
    this.publicCache.set(organization.id, { data: result, expires_at: Date.now() + 30_000 });
    return result;
  }

  async getPublicAsset(assetId: string) {
    if (!isUUID(assetId)) throw new NotFoundException('Mídia pública não encontrada.');
    const asset = await AppDataBase.getRepository(MediaAsset).findOne({
      where: {
        id: assetId,
        visibility: MediaAssetVisibility.PUBLIC,
        status: MediaAssetStatus.ACTIVE,
      },
    });
    if (!asset || !asset.key.startsWith(`org_${asset.organization_id}/`)) {
      throw new NotFoundException('Mídia pública não encontrada.');
    }
    const object = await readPublicObject(asset.organization_id, asset.key);
    return {
      body: object.body,
      mime_type: asset.mime_type,
      size_bytes: Number(asset.size_bytes),
    };
  }

  revalidate(organizationId: string): void {
    this.publicCache.delete(organizationId);
  }

  private async findOrganization(organizationId: string) {
    const organization = await AppDataBase.getRepository(Organization).findOneBy({ id: organizationId });
    if (!organization) throw new NotFoundException('Organização não encontrada.');
    return organization;
  }

  private validateSections(sections: Array<{
    type: OrgHomeSectionType;
    order_index: number;
    config: unknown;
  }>): void {
    const types = new Set<string>();
    const orderIndexes = new Set<number>();
    for (const section of sections) {
      if (types.has(section.type) || orderIndexes.has(section.order_index)) {
        throw new BadRequestException('Cada seção deve ter tipo e posição únicos.');
      }
      types.add(section.type);
      orderIndexes.add(section.order_index);
      const result = validateOrgHomeSectionConfig(section.type, section.config);
      if (!result.success) {
        throw new BadRequestException({
          message: `Configuração inválida para a seção ${section.type}.`,
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
    }
  }

  private async validatePublicAssetReferences(organizationId: string, input: ConfigInput | Record<string, unknown>) {
    const ids = new Set<string>();
    const collect = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach(collect);
      } else if (typeof value === 'object' && value !== null) {
        for (const [key, item] of Object.entries(value)) {
          if (key.endsWith('_asset_id') && typeof item === 'string') ids.add(item);
          else collect(item);
        }
      }
    };
    collect(input);
    if (ids.size === 0) return;

    const assets = await AppDataBase.getRepository(MediaAsset).find({
      where: {
        organization_id: organizationId,
        id: In([...ids]),
        status: MediaAssetStatus.ACTIVE,
        visibility: MediaAssetVisibility.PUBLIC,
      },
    });
    if (assets.length !== ids.size) {
      throw new BadRequestException('Use apenas imagens públicas ativas desta organização.');
    }
    for (const asset of assets) {
      if (!asset.key.startsWith(`org_${organizationId}/`)) {
        throw new ForbiddenException('Uma imagem está fora do escopo desta organização.');
      }
    }
  }

  private async getPublicMiscellaneous(
    organizationId: string,
    sectionType: 'AGENDA' | 'NOTICIAS',
    config: { limit: number; manual_highlight_ids: string[] },
  ): Promise<PublicContentItem[]> {
    const types = sectionType === 'AGENDA' ? ['event'] : ['activity', 'project'];
    const items = await AppDataBase.query(
      `SELECT id, title, description, start_date, end_date, location_city, location_state,
              public_slug, cover_asset_id
       FROM miscellaneous
       WHERE organization_id = $1
         AND status = 'active'
         AND visibility = 'public'
         AND participation_type = 'public'
         AND public_access_enabled = true
         AND type = ANY($2::varchar[])
         AND ($3::uuid[] = '{}'::uuid[] OR id = ANY($3::uuid[]))
       ORDER BY
         CASE WHEN cardinality($3::uuid[]) > 0 THEN array_position($3::uuid[], id) END NULLS LAST,
         CASE WHEN $4 = 'AGENDA' THEN start_date END ASC,
         CASE WHEN $4 = 'NOTICIAS' THEN start_date END DESC
       LIMIT $5`,
      [
        organizationId,
        types,
        config.manual_highlight_ids,
        sectionType,
        config.limit,
      ],
    ) as PublicContentItem[];
    for (const item of items) {
      if (!item.cover_asset_id) continue;
      const cover = await this.publicAssetUrl(organizationId, item.cover_asset_id);
      if (cover) item.cover_url = cover;
    }
    return items;
  }

  private async hydrateHeroSlides(
    organizationId: string,
    slides: Array<{
      title: string;
      description?: string;
      image_asset_id?: string;
      image_alt?: string;
      video_url?: string;
      button_text?: string;
      button_url?: string;
    }>,
  ) {
    const output = [];
    for (const slide of slides) {
      if (slide.image_asset_id) {
        const image = await this.publicAssetUrl(organizationId, slide.image_asset_id);
        if (!image) continue;
        output.push({ ...slide, image_url: image });
      } else {
        output.push(slide);
      }
    }
    return output;
  }

  private async hydratePartnerLogos(
    organizationId: string,
    items: Array<{ name: string; logo_asset_id?: string; image_alt?: string; url?: string }>,
  ) {
    const output = [];
    for (const item of items) {
      if (!item.logo_asset_id) continue;
      const logo = await this.publicAssetUrl(organizationId, item.logo_asset_id);
      if (logo) output.push({ ...item, logo_url: logo });
    }
    return output;
  }

  private async hydrateTheme(organizationId: string, theme: OrgHomeConfig['theme']) {
    const logoUrl = theme.logo_asset_id
      ? await this.publicAssetUrl(organizationId, theme.logo_asset_id)
      : null;
    const faviconUrl = theme.favicon_asset_id
      ? await this.publicAssetUrl(organizationId, theme.favicon_asset_id)
      : null;
    return { ...theme, logo_url: logoUrl, favicon_url: faviconUrl };
  }

  private async hydrateSeo(organizationId: string, seo: OrgHomeConfig['seo']) {
    const ogImageUrl = seo.og_image_asset_id
      ? await this.publicAssetUrl(organizationId, seo.og_image_asset_id)
      : null;
    return { ...seo, og_image_url: ogImageUrl };
  }

  private async publicAssetUrl(organizationId: string, assetId: string): Promise<string | null> {
    const asset = await AppDataBase.getRepository(MediaAsset).findOne({
      where: {
        id: assetId,
        organization_id: organizationId,
        status: MediaAssetStatus.ACTIVE,
        visibility: MediaAssetVisibility.PUBLIC,
      },
    });
    if (!asset || !asset.key.startsWith(`org_${organizationId}/`)) return null;
    return `/m/${asset.id}`;
  }
}
