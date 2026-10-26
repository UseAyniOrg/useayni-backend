"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTenantPhase01780000000000 = void 0;
class MultiTenantPhase01780000000000 {
    async up(queryRunner) {
        // ─── Plans ────────────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(50)  NOT NULL UNIQUE,
        description TEXT,
        price_brl   DECIMAL(10,2) NOT NULL DEFAULT 0,
        is_active   BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS plan_features (
        plan_id      UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        feature_slug VARCHAR(100) NOT NULL,
        PRIMARY KEY (plan_id, feature_slug)
      );
    `);
        // ─── Organizations ────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        slug       VARCHAR(100) NOT NULL UNIQUE,
        plan_id    UUID REFERENCES plans(id) ON DELETE SET NULL,
        status     VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
        settings   JSONB        NOT NULL DEFAULT '{}',
        theme      JSONB        NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ  DEFAULT now() NOT NULL,
        updated_at TIMESTAMPTZ  DEFAULT now() NOT NULL,
        deleted_at TIMESTAMPTZ
      );
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS organization_features (
        organization_id UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        feature_slug    VARCHAR(100) NOT NULL,
        enabled         BOOLEAN     NOT NULL DEFAULT true,
        config          JSONB       NOT NULL DEFAULT '{}',
        updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        PRIMARY KEY (organization_id, feature_slug)
      );
    `);
        // ─── Add organization_id to domain tables (nullable for migration) ────────
        await queryRunner.query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    `);
        await queryRunner.query(`
      ALTER TABLE miscellaneous
        ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
    `);
        // ─── Indexes ──────────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_members_org_id
        ON members(organization_id);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_miscellaneous_org_id
        ON miscellaneous(organization_id);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_slug
        ON organizations(slug) WHERE deleted_at IS NULL;
    `);
        // ─── Trigger for updated_at ───────────────────────────────────────────────
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_organizations_updated'
        ) THEN
          CREATE TRIGGER trg_organizations_updated
            BEFORE UPDATE ON organizations
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
        END IF;
      END $$;
    `);
        // ─── Seed platform plans; organizations are created by the platform admin ──
        await queryRunner.query(`
      INSERT INTO plans (id, name, slug, description, price_brl)
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'Essencial',    'essential',    'Plano de entrada',                    0),
        ('00000000-0000-0000-0000-000000000002', 'Gestão',       'gestao',       'Miscelâneas completas + finanças',   199),
        ('00000000-0000-0000-0000-000000000003', 'Governança',   'governanca',   'Hierarquia multi-nível + eleições',  499),
        ('00000000-0000-0000-0000-000000000004', 'Institucional','institucional', 'Enterprise + multi-instituição',    999)
      ON CONFLICT (slug) DO NOTHING;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE miscellaneous DROP COLUMN IF EXISTS organization_id;`);
        await queryRunner.query(`ALTER TABLE members DROP COLUMN IF EXISTS organization_id;`);
        await queryRunner.query(`DROP TABLE IF EXISTS organization_features;`);
        await queryRunner.query(`DROP TABLE IF EXISTS organizations;`);
        await queryRunner.query(`DROP TABLE IF EXISTS plan_features;`);
        await queryRunner.query(`DROP TABLE IF EXISTS plans;`);
    }
}
exports.MultiTenantPhase01780000000000 = MultiTenantPhase01780000000000;
