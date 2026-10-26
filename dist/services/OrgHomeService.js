"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgHomeService = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const typeorm_1 = require("typeorm");
const zod_1 = require("zod");
const db_1 = require("../db");
const orgHomeSections_1 = require("../config/orgHomeSections");
const mediaAsset_1 = require("../models/mediaAsset");
const organization_1 = require("../models/organization");
const orgHomeConfig_1 = require("../models/orgHomeConfig");
const orgHomeSection_1 = require("../models/orgHomeSection");
const r2_1 = require("../lib/storage/r2");
const optionalText = zod_1.z.string().trim().max(2000).optional();
const httpsUrl = zod_1.z.string().trim().url().refine((value) => value.startsWith('https://'));
const configInputSchema = zod_1.z.object({
    theme: zod_1.z.object({
        primary_color: zod_1.z.string().regex(/^#[0-9a-f]{6}$/i),
        secondary_color: zod_1.z.string().regex(/^#[0-9a-f]{6}$/i),
        background_color: zod_1.z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        logo_background_color: zod_1.z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        logo_asset_id: zod_1.z.string().uuid().nullable().optional(),
        favicon_asset_id: zod_1.z.string().uuid().nullable().optional(),
        font_family: zod_1.z.enum(['Inter', 'Lato', 'Poppins']).optional(),
    }).strict(),
    seo: zod_1.z.object({
        title: optionalText,
        description: optionalText,
        og_image_asset_id: zod_1.z.string().uuid().nullable().optional(),
    }).strict(),
    social_links: zod_1.z.object({
        instagram: httpsUrl.optional(),
        linkedin: httpsUrl.optional(),
        facebook: httpsUrl.optional(),
        youtube: httpsUrl.optional(),
        tiktok: httpsUrl.optional(),
    }).strict(),
    contact: zod_1.z.object({
        address: optionalText,
        phone: zod_1.z.string().trim().max(40).optional(),
        whatsapp: zod_1.z.string().trim().max(40).optional(),
        email: zod_1.z.string().trim().email().max(255).optional(),
        map_url: httpsUrl.optional(),
    }).strict(),
    sections: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        type: zod_1.z.enum(orgHomeSections_1.ORG_HOME_SECTION_TYPES),
        order_index: zod_1.z.number().int().min(0).max(1000),
        enabled: zod_1.z.boolean(),
        title: zod_1.z.string().trim().max(255),
        subtitle: zod_1.z.string().trim().max(500),
        config: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    }).strict()).min(1).max(18),
}).strict();
let OrgHomeService = class OrgHomeService {
    constructor() {
        this.publicCache = new Map();
    }
    async ensureDefaultHome(organizationId, transactionManager) {
        const initialize = async (manager) => {
            await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [organizationId]);
            const organization = await manager.getRepository(organization_1.Organization).findOneBy({ id: organizationId });
            if (!organization)
                throw new common_1.NotFoundException('Organização não encontrada.');
            const settings = organization.settings ?? {};
            const publicHome = typeof settings.public_home === 'object' && settings.public_home !== null
                ? settings.public_home
                : {};
            const publicTitle = typeof publicHome.title === 'string' ? publicHome.title.trim() : '';
            const publicDescription = typeof publicHome.description === 'string' ? publicHome.description.trim() : '';
            const configuredPrimaryColor = typeof organization.theme.primary_color === 'string' &&
                /^#[0-9a-f]{6}$/i.test(organization.theme.primary_color)
                ? organization.theme.primary_color
                : '#0e79b2';
            const configRepo = manager.getRepository(orgHomeConfig_1.OrgHomeConfig);
            const config = await configRepo.findOneBy({ organization_id: organizationId });
            if (!config) {
                await configRepo.save(configRepo.create({
                    organization_id: organizationId,
                    status: orgHomeConfig_1.OrgHomeStatus.PUBLISHED,
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
            const sectionRepo = manager.getRepository(orgHomeSection_1.OrgHomeSection);
            const count = await sectionRepo.countBy({ organization_id: organizationId });
            if (count === 0) {
                const template = (0, orgHomeSections_1.defaultOrgHomeSections)();
                const hero = template.find((section) => section.type === 'HERO');
                if (hero && (publicTitle || publicDescription)) {
                    hero.title = publicTitle;
                    hero.subtitle = publicDescription;
                    const slides = hero.config.slides;
                    slides[0] = {
                        ...slides[0],
                        title: publicTitle || slides[0].title,
                        description: publicDescription || slides[0].description,
                    };
                }
                await sectionRepo.save(template.map((section) => sectionRepo.create({ ...section, organization_id: organizationId })));
            }
        };
        if (transactionManager)
            await initialize(transactionManager);
        else
            await db_1.AppDataBase.transaction(initialize);
    }
    async getEditorConfig(organizationId) {
        await this.findOrganization(organizationId);
        await this.ensureDefaultHome(organizationId);
        const [config, sections] = await Promise.all([
            db_1.AppDataBase.getRepository(orgHomeConfig_1.OrgHomeConfig).findOneBy({ organization_id: organizationId }),
            db_1.AppDataBase.getRepository(orgHomeSection_1.OrgHomeSection).find({
                where: { organization_id: organizationId },
                order: { order_index: 'ASC' },
            }),
        ]);
        if (!config)
            throw new common_1.InternalServerErrorException('A configuração da home não foi inicializada.');
        return { config, sections };
    }
    async saveDraft(organizationId, actorId, input) {
        await this.findOrganization(organizationId);
        const parsed = configInputSchema.safeParse(input);
        if (!parsed.success) {
            throw new common_1.BadRequestException({
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
        const savedConfig = await db_1.AppDataBase.transaction(async (manager) => {
            const configRepo = manager.getRepository(orgHomeConfig_1.OrgHomeConfig);
            const current = await configRepo.findOneBy({ organization_id: organizationId });
            if (!current)
                throw new common_1.InternalServerErrorException('Configuração da home não encontrada.');
            Object.assign(current, {
                theme: {
                    ...parsed.data.theme,
                    background_color: parsed.data.theme.background_color ?? current.theme.background_color ?? '#020617',
                    logo_background_color: parsed.data.theme.logo_background_color ?? current.theme.logo_background_color ?? '#0d1b2a',
                },
                seo: parsed.data.seo,
                social_links: parsed.data.social_links,
                contact: parsed.data.contact,
                status: orgHomeConfig_1.OrgHomeStatus.DRAFT,
                updated_by: actorId,
            });
            const saved = await configRepo.save(current);
            const sectionRepo = manager.getRepository(orgHomeSection_1.OrgHomeSection);
            await sectionRepo.delete({ organization_id: organizationId });
            await sectionRepo.save(parsed.data.sections.map((section) => sectionRepo.create({
                organization_id: organizationId,
                type: section.type,
                order_index: section.order_index,
                enabled: section.enabled,
                title: section.title,
                subtitle: section.subtitle,
                config: section.config,
                updated_by: actorId,
            })));
            return saved;
        });
        this.revalidate(organizationId);
        return { config: savedConfig, sections: parsed.data.sections };
    }
    async publish(organizationId, actorId) {
        await this.ensureDefaultHome(organizationId);
        const [config, sections] = await Promise.all([
            db_1.AppDataBase.getRepository(orgHomeConfig_1.OrgHomeConfig).findOneBy({ organization_id: organizationId }),
            db_1.AppDataBase.getRepository(orgHomeSection_1.OrgHomeSection).findBy({ organization_id: organizationId }),
        ]);
        if (!config)
            throw new common_1.InternalServerErrorException('Configuração da home não encontrada.');
        if (sections.length === 0)
            throw new common_1.BadRequestException('Adicione pelo menos uma seção à home.');
        this.validateSections(sections);
        await this.validatePublicAssetReferences(organizationId, {
            theme: config.theme,
            seo: config.seo,
            social_links: config.social_links,
            contact: config.contact,
            sections,
        });
        config.status = orgHomeConfig_1.OrgHomeStatus.PUBLISHED;
        config.published_at = new Date();
        config.updated_by = actorId;
        const saved = await db_1.AppDataBase.getRepository(orgHomeConfig_1.OrgHomeConfig).save(config);
        this.revalidate(organizationId);
        return saved;
    }
    async getPublicHome(slug) {
        const organization = await db_1.AppDataBase.getRepository(organization_1.Organization).findOne({
            where: { slug },
        });
        if (!organization || ![organization_1.OrganizationStatus.ACTIVE, organization_1.OrganizationStatus.TRIAL].includes(organization.status)) {
            throw new common_1.NotFoundException('Página da organização não encontrada.');
        }
        await this.ensureDefaultHome(organization.id);
        const cached = this.publicCache.get(organization.id);
        if (cached && cached.expires_at > Date.now())
            return cached.data;
        const [config, sections] = await Promise.all([
            db_1.AppDataBase.getRepository(orgHomeConfig_1.OrgHomeConfig).findOneBy({ organization_id: organization.id }),
            db_1.AppDataBase.getRepository(orgHomeSection_1.OrgHomeSection).find({
                where: { organization_id: organization.id, enabled: true },
                order: { order_index: 'ASC' },
            }),
        ]);
        if (!config || config.status !== orgHomeConfig_1.OrgHomeStatus.PUBLISHED) {
            throw new common_1.NotFoundException('Página pública ainda não publicada.');
        }
        const featureRows = (await db_1.AppDataBase.query(`SELECT feature_slug
       FROM organization_features
       WHERE organization_id = $1 AND enabled = true`, [organization.id]));
        const features = new Set(featureRows.map((row) => row.feature_slug));
        const publicHomeSections = [];
        for (const section of sections) {
            if (section.type === 'PARCEIROS' && !features.has('sponsors'))
                continue;
            if (section.type === 'TALENTOS' && !features.has('talent_network'))
                continue;
            const validated = (0, orgHomeSections_1.validateOrgHomeSectionConfig)(section.type, section.config);
            if (!validated.success) {
                throw new common_1.InternalServerErrorException(`Configuração inválida na seção ${section.type}.`);
            }
            const sectionData = {
                id: section.id,
                type: section.type,
                order_index: section.order_index,
                title: section.title,
                subtitle: section.subtitle,
                config: validated.data,
            };
            if (section.type === 'AGENDA' || section.type === 'NOTICIAS') {
                if (!features.has('miscellaneous_full') || !features.has('miscellaneous_public'))
                    continue;
                const content = await this.getPublicMiscellaneous(organization.id, section.type, validated.data);
                if (content.length === 0)
                    continue;
                sectionData.items = content;
            }
            else if (section.type === 'NUMEROS') {
                const numbers = [...validated.data.items];
                if (validated.data.include_member_count === true) {
                    const [row] = await db_1.AppDataBase.query(`SELECT COUNT(*)::int AS total
             FROM members
             WHERE organization_id = $1 AND registration_status = 'approved'`, [organization.id]);
                    numbers.push({ label: 'Membros', value: String(row.total) });
                }
                else {
                    for (let i = numbers.length - 1; i >= 0; i -= 1) {
                        if (numbers[i].key === 'members')
                            numbers.splice(i, 1);
                    }
                }
                if (numbers.length === 0)
                    continue;
                sectionData.config = { ...validated.data, items: numbers };
            }
            else if (section.type === 'PARCEIROS') {
                const items = await this.hydratePartnerLogos(organization.id, validated.data.items);
                if (items.length === 0)
                    continue;
                sectionData.config = { ...validated.data, items };
            }
            else if (section.type === 'TALENTOS') {
                sectionData.show_button = features.has('talent_network');
            }
            else if (section.type === 'HERO') {
                sectionData.config = {
                    ...validated.data,
                    slides: await this.hydrateHeroSlides(organization.id, validated.data.slides),
                };
                if (sectionData.config.slides.length === 0)
                    continue;
            }
            else if (section.type === 'CAMINHOS' || section.type === 'VANTAGENS') {
                if (validated.data.items.length === 0)
                    continue;
            }
            else if (section.type === 'CONTATO') {
                const hasContact = Object.values(config.contact ?? {}).some((value) => Boolean(value)) ||
                    Object.values(config.social_links ?? {}).some((value) => Boolean(value));
                if (!hasContact)
                    continue;
            }
            publicHomeSections.push(sectionData);
        }
        const result = {
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
        this.publicCache.set(organization.id, { data: result, expires_at: Date.now() + 30000 });
        return result;
    }
    async getPublicAsset(assetId) {
        if (!(0, class_validator_1.isUUID)(assetId))
            throw new common_1.NotFoundException('Mídia pública não encontrada.');
        const asset = await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).findOne({
            where: {
                id: assetId,
                visibility: mediaAsset_1.MediaAssetVisibility.PUBLIC,
                status: mediaAsset_1.MediaAssetStatus.ACTIVE,
            },
        });
        if (!asset || !asset.key.startsWith(`org_${asset.organization_id}/`)) {
            throw new common_1.NotFoundException('Mídia pública não encontrada.');
        }
        const object = await (0, r2_1.readPublicObject)(asset.organization_id, asset.key);
        return {
            body: object.body,
            mime_type: asset.mime_type,
            size_bytes: Number(asset.size_bytes),
        };
    }
    revalidate(organizationId) {
        this.publicCache.delete(organizationId);
    }
    async findOrganization(organizationId) {
        const organization = await db_1.AppDataBase.getRepository(organization_1.Organization).findOneBy({ id: organizationId });
        if (!organization)
            throw new common_1.NotFoundException('Organização não encontrada.');
        return organization;
    }
    validateSections(sections) {
        const types = new Set();
        const orderIndexes = new Set();
        for (const section of sections) {
            if (types.has(section.type) || orderIndexes.has(section.order_index)) {
                throw new common_1.BadRequestException('Cada seção deve ter tipo e posição únicos.');
            }
            types.add(section.type);
            orderIndexes.add(section.order_index);
            const result = (0, orgHomeSections_1.validateOrgHomeSectionConfig)(section.type, section.config);
            if (!result.success) {
                throw new common_1.BadRequestException({
                    message: `Configuração inválida para a seção ${section.type}.`,
                    issues: result.error.issues.map((issue) => ({
                        path: issue.path.join('.'),
                        message: issue.message,
                    })),
                });
            }
        }
    }
    async validatePublicAssetReferences(organizationId, input) {
        const ids = new Set();
        const collect = (value) => {
            if (Array.isArray(value)) {
                value.forEach(collect);
            }
            else if (typeof value === 'object' && value !== null) {
                for (const [key, item] of Object.entries(value)) {
                    if (key.endsWith('_asset_id') && typeof item === 'string')
                        ids.add(item);
                    else
                        collect(item);
                }
            }
        };
        collect(input);
        if (ids.size === 0)
            return;
        const assets = await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).find({
            where: {
                organization_id: organizationId,
                id: (0, typeorm_1.In)([...ids]),
                status: mediaAsset_1.MediaAssetStatus.ACTIVE,
                visibility: mediaAsset_1.MediaAssetVisibility.PUBLIC,
            },
        });
        if (assets.length !== ids.size) {
            throw new common_1.BadRequestException('Use apenas imagens públicas ativas desta organização.');
        }
        for (const asset of assets) {
            if (!asset.key.startsWith(`org_${organizationId}/`)) {
                throw new common_1.ForbiddenException('Uma imagem está fora do escopo desta organização.');
            }
        }
    }
    async getPublicMiscellaneous(organizationId, sectionType, config) {
        const types = sectionType === 'AGENDA' ? ['event'] : ['activity', 'project'];
        const items = await db_1.AppDataBase.query(`SELECT id, title, description, start_date, end_date, location_city, location_state,
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
       LIMIT $5`, [
            organizationId,
            types,
            config.manual_highlight_ids,
            sectionType,
            config.limit,
        ]);
        for (const item of items) {
            if (!item.cover_asset_id)
                continue;
            const cover = await this.publicAssetUrl(organizationId, item.cover_asset_id);
            if (cover)
                item.cover_url = cover;
        }
        return items;
    }
    async hydrateHeroSlides(organizationId, slides) {
        const output = [];
        for (const slide of slides) {
            if (slide.image_asset_id) {
                const image = await this.publicAssetUrl(organizationId, slide.image_asset_id);
                if (!image)
                    continue;
                output.push({ ...slide, image_url: image });
            }
            else {
                output.push(slide);
            }
        }
        return output;
    }
    async hydratePartnerLogos(organizationId, items) {
        const output = [];
        for (const item of items) {
            if (!item.logo_asset_id)
                continue;
            const logo = await this.publicAssetUrl(organizationId, item.logo_asset_id);
            if (logo)
                output.push({ ...item, logo_url: logo });
        }
        return output;
    }
    async hydrateTheme(organizationId, theme) {
        const logoUrl = theme.logo_asset_id
            ? await this.publicAssetUrl(organizationId, theme.logo_asset_id)
            : null;
        const faviconUrl = theme.favicon_asset_id
            ? await this.publicAssetUrl(organizationId, theme.favicon_asset_id)
            : null;
        return { ...theme, logo_url: logoUrl, favicon_url: faviconUrl };
    }
    async hydrateSeo(organizationId, seo) {
        const ogImageUrl = seo.og_image_asset_id
            ? await this.publicAssetUrl(organizationId, seo.og_image_asset_id)
            : null;
        return { ...seo, og_image_url: ogImageUrl };
    }
    async publicAssetUrl(organizationId, assetId) {
        const asset = await db_1.AppDataBase.getRepository(mediaAsset_1.MediaAsset).findOne({
            where: {
                id: assetId,
                organization_id: organizationId,
                status: mediaAsset_1.MediaAssetStatus.ACTIVE,
                visibility: mediaAsset_1.MediaAssetVisibility.PUBLIC,
            },
        });
        if (!asset || !asset.key.startsWith(`org_${organizationId}/`))
            return null;
        return `/m/${asset.id}`;
    }
};
exports.OrgHomeService = OrgHomeService;
exports.OrgHomeService = OrgHomeService = __decorate([
    (0, common_1.Injectable)()
], OrgHomeService);
