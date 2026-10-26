import { MigrationInterface, QueryRunner } from 'typeorm';

export class MediaStorage17800000000007 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE media_assets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        key TEXT NOT NULL UNIQUE,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
        category VARCHAR(50) NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'ACTIVE', 'PENDING_DELETION')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX media_assets_org_status_idx ON media_assets(organization_id, status);
      CREATE INDEX media_assets_pending_created_idx ON media_assets(created_at)
        WHERE status = 'PENDING';

      ALTER TABLE miscellaneous
        ADD COLUMN cover_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
        ADD COLUMN banner_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
        ADD COLUMN map_asset_id UUID REFERENCES media_assets(id) ON DELETE SET NULL,
        ADD COLUMN sponsor_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

      INSERT INTO organization_features (organization_id, feature_slug, enabled, config)
      SELECT id, 'media_storage', true, '{"quota_bytes":1073741824}'::jsonb
      FROM organizations
      WHERE deleted_at IS NULL
      ON CONFLICT (organization_id, feature_slug) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE miscellaneous
        DROP COLUMN IF EXISTS sponsor_asset_ids,
        DROP COLUMN IF EXISTS map_asset_id,
        DROP COLUMN IF EXISTS banner_asset_id,
        DROP COLUMN IF EXISTS cover_asset_id;
      DELETE FROM organization_features WHERE feature_slug = 'media_storage';
      DROP TABLE IF EXISTS media_assets;
    `);
  }
}
