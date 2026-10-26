import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlatformOperations17800000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE organizations
        ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN suspension_reason TEXT,
        ADD COLUMN suspended_at TIMESTAMPTZ,
        ADD COLUMN suspended_by_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE audit_logs
        ADD COLUMN actor_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
        ADD COLUMN actor_type VARCHAR(30);
      CREATE INDEX idx_audit_logs_actor_account ON audit_logs(actor_account_id);
    `);

    await queryRunner.query(`
      CREATE TABLE platform_support_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        actor_account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
        actor_member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
        reason TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked_at TIMESTAMPTZ,
        revoked_by_account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX idx_platform_support_sessions_active
        ON platform_support_sessions(actor_account_id, organization_id, expires_at)
        WHERE revoked_at IS NULL;
      ALTER TABLE audit_logs
        ADD COLUMN support_session_id UUID REFERENCES platform_support_sessions(id) ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      INSERT INTO organization_features (organization_id, feature_slug, enabled, config)
      SELECT organization.id, 'core', true, '{}'::jsonb
      FROM organizations AS organization
      WHERE organization.deleted_at IS NULL
      ON CONFLICT (organization_id, feature_slug) DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO organization_features (organization_id, feature_slug, enabled, config)
      SELECT organization.id, feature.slug, true, '{}'::jsonb
      FROM organizations AS organization
      CROSS JOIN (VALUES
        ('miscellaneous_public'),
        ('registration_approval'),
        ('custom_fields')
      ) AS feature(slug)
      WHERE organization.deleted_at IS NULL
        AND organization.status <> 'DRAFT'
        AND (
          feature.slug <> 'miscellaneous_public'
          OR EXISTS (
            SELECT 1
            FROM organization_features AS full_module
            WHERE full_module.organization_id = organization.id
              AND full_module.feature_slug = 'miscellaneous_full'
              AND full_module.enabled = true
          )
        )
      ON CONFLICT (organization_id, feature_slug) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_actor_account;`);
    await queryRunner.query(`
      ALTER TABLE audit_logs DROP COLUMN IF EXISTS actor_account_id;
      ALTER TABLE audit_logs DROP COLUMN IF EXISTS actor_type;
      ALTER TABLE audit_logs DROP COLUMN IF EXISTS support_session_id;
      DROP TABLE IF EXISTS platform_support_sessions;
      ALTER TABLE organizations
        DROP COLUMN IF EXISTS suspended_by_account_id,
        DROP COLUMN IF EXISTS suspended_at,
        DROP COLUMN IF EXISTS suspension_reason,
        DROP COLUMN IF EXISTS onboarding_step;
    `);
  }
}
