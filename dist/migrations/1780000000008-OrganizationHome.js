"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationHome17800000000008 = void 0;
class OrganizationHome17800000000008 {
    constructor() {
        this.name = 'OrganizationHome17800000000008';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE media_assets
      ADD COLUMN visibility varchar(10) NOT NULL DEFAULT 'PRIVATE'
      CHECK (visibility IN ('PUBLIC', 'PRIVATE'))
    `);
        await queryRunner.query(`
      UPDATE media_assets AS asset
      SET visibility = 'PUBLIC'
      WHERE EXISTS (
        SELECT 1
        FROM miscellaneous AS misc
        WHERE misc.organization_id = asset.organization_id
          AND misc.status = 'active'
          AND misc.public_access_enabled = true
          AND (
            misc.cover_asset_id = asset.id
            OR misc.banner_asset_id = asset.id
            OR misc.map_asset_id = asset.id
            OR misc.sponsor_asset_ids @> jsonb_build_array(asset.id::text)
          )
      )
    `);
        await queryRunner.query(`
      CREATE TABLE organization_home_configs (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        status varchar(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
        theme jsonb NOT NULL DEFAULT '{}'::jsonb,
        seo jsonb NOT NULL DEFAULT '{}'::jsonb,
        social_links jsonb NOT NULL DEFAULT '{}'::jsonb,
        contact jsonb NOT NULL DEFAULT '{}'::jsonb,
        published_at timestamptz,
        updated_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
        await queryRunner.query(`
      CREATE TABLE organization_home_sections (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        type varchar(40) NOT NULL,
        order_index integer NOT NULL DEFAULT 0,
        enabled boolean NOT NULL DEFAULT true,
        title varchar(255) NOT NULL DEFAULT '',
        subtitle varchar(500) NOT NULL DEFAULT '',
        config jsonb NOT NULL DEFAULT '{}'::jsonb,
        updated_by uuid,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE (organization_id, type)
      )
    `);
        await queryRunner.query(`
      CREATE INDEX organization_home_sections_org_order_idx
      ON organization_home_sections (organization_id, order_index)
    `);
        await queryRunner.query(`
      CREATE INDEX organization_home_sections_org_type_idx
      ON organization_home_sections (organization_id, type)
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE organization_home_sections');
        await queryRunner.query('DROP TABLE organization_home_configs');
        await queryRunner.query('ALTER TABLE media_assets DROP COLUMN visibility');
    }
}
exports.OrganizationHome17800000000008 = OrganizationHome17800000000008;
