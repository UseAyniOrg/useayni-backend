import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiTenantPhase21780000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── Custom field definitions per org ─────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS member_custom_field_definitions (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        field_key       VARCHAR(100) NOT NULL,
        label           VARCHAR(255) NOT NULL,
        field_type      VARCHAR(30)  NOT NULL DEFAULT 'text',
        required        BOOLEAN      NOT NULL DEFAULT false,
        options         JSONB,
        position        INTEGER      NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ  DEFAULT now() NOT NULL,
        UNIQUE (organization_id, field_key)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS member_custom_field_values (
        member_id  UUID         NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        field_key  VARCHAR(100) NOT NULL,
        value      TEXT,
        PRIMARY KEY (member_id, field_key)
      );
    `);

    // ─── Registration drafts (step-by-step, 72h TTL) ──────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS registration_drafts (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        email           VARCHAR(255) NOT NULL,
        data            JSONB        NOT NULL DEFAULT '{}',
        current_step    INTEGER      NOT NULL DEFAULT 1,
        expires_at      TIMESTAMPTZ  NOT NULL,
        created_at      TIMESTAMPTZ  DEFAULT now() NOT NULL,
        UNIQUE (organization_id, email)
      );
    `);

    // ─── Member subscriptions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS member_subscriptions (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        member_id       UUID        NOT NULL REFERENCES members(id)       ON DELETE CASCADE,
        status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        started_at      DATE,
        expires_at      DATE,
        payment_method  VARCHAR(20),
        created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);

    // ─── Extend members table ─────────────────────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(10) NOT NULL DEFAULT 'PRIVATE',
        ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
    `);

    // Back-fill existing members as APPROVED so they keep working
    await queryRunner.query(`
      UPDATE members SET registration_status = 'APPROVED'
      WHERE organization_id IS NOT NULL AND registration_status = 'PENDING';
    `);

    // ─── Indexes ──────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_custom_fields_org ON member_custom_field_definitions(organization_id);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_member ON member_subscriptions(member_id, status);`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE members DROP COLUMN IF EXISTS registration_status;`);
    await queryRunner.query(`ALTER TABLE members DROP COLUMN IF EXISTS profile_visibility;`);
    await queryRunner.query(`DROP TABLE IF EXISTS member_subscriptions;`);
    await queryRunner.query(`DROP TABLE IF EXISTS registration_drafts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS member_custom_field_values;`);
    await queryRunner.query(`DROP TABLE IF EXISTS member_custom_field_definitions;`);
  }
}
