"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiTenantPhase11780000000001 = void 0;
class MultiTenantPhase11780000000001 {
    async up(queryRunner) {
        // ─── OrgUnitTypes ─────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS org_unit_types (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        slug            VARCHAR(50)  NOT NULL,
        name            VARCHAR(100) NOT NULL,
        metadata_schema JSONB NOT NULL DEFAULT '{}',
        created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        UNIQUE (organization_id, slug)
      );
    `);
        // ─── OrgUnits (recursive tree) ────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS org_units (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        parent_id       UUID REFERENCES org_units(id) ON DELETE SET NULL,
        type_id         UUID NOT NULL REFERENCES org_unit_types(id) ON DELETE RESTRICT,
        name            VARCHAR(255) NOT NULL,
        slug            VARCHAR(255) NOT NULL,
        metadata        JSONB NOT NULL DEFAULT '{}',
        status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        deleted_at      TIMESTAMPTZ,
        UNIQUE (organization_id, slug)
      );
    `);
        // ─── Positions (cargos) ───────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        org_unit_type_id     UUID NOT NULL REFERENCES org_unit_types(id) ON DELETE CASCADE,
        name                 VARCHAR(100) NOT NULL,
        investiture_type     VARCHAR(20)  NOT NULL DEFAULT 'ELECTION',
        mandate_duration_days INTEGER,
        allows_deputy        BOOLEAN NOT NULL DEFAULT false,
        created_at           TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at           TIMESTAMPTZ DEFAULT now() NOT NULL,
        deleted_at           TIMESTAMPTZ
      );
    `);
        // ─── Position <-> Roles ───────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS position_roles (
        position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
        role_id     UUID NOT NULL REFERENCES roles(id)     ON DELETE CASCADE,
        PRIMARY KEY (position_id, role_id)
      );
    `);
        // ─── Mandates ─────────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS mandates (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        position_id     UUID NOT NULL REFERENCES positions(id)     ON DELETE CASCADE,
        org_unit_id     UUID NOT NULL REFERENCES org_units(id)     ON DELETE CASCADE,
        member_id       UUID NOT NULL REFERENCES members(id)       ON DELETE CASCADE,
        start_date      DATE NOT NULL,
        end_date        DATE,
        status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
        // ─── Audit logs ───────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        actor_id        UUID REFERENCES members(id) ON DELETE SET NULL,
        action          VARCHAR(100) NOT NULL,
        entity_type     VARCHAR(50)  NOT NULL,
        entity_id       UUID         NOT NULL,
        before_state    JSONB,
        after_state     JSONB,
        ip_address      VARCHAR(45),
        created_at      TIMESTAMPTZ DEFAULT now() NOT NULL
      );
    `);
        // ─── Indexes ──────────────────────────────────────────────────────────────
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_units_org ON org_units(organization_id);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_org_units_parent ON org_units(parent_id);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_positions_org ON positions(organization_id);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_mandates_org ON mandates(organization_id);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_mandates_member ON mandates(member_id, status);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_mandates_unit ON mandates(org_unit_id, status);`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id, created_at DESC);`);
        // ─── Triggers ─────────────────────────────────────────────────────────────
        for (const table of ['org_unit_types', 'org_units', 'positions', 'mandates']) {
            await queryRunner.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger WHERE tgname = 'trg_${table}_updated'
          ) THEN
            CREATE TRIGGER trg_${table}_updated
              BEFORE UPDATE ON ${table}
              FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
          END IF;
        END $$;
      `);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS audit_logs;`);
        await queryRunner.query(`DROP TABLE IF EXISTS mandates;`);
        await queryRunner.query(`DROP TABLE IF EXISTS position_roles;`);
        await queryRunner.query(`DROP TABLE IF EXISTS positions;`);
        await queryRunner.query(`DROP TABLE IF EXISTS org_units;`);
        await queryRunner.query(`DROP TABLE IF EXISTS org_unit_types;`);
    }
}
exports.MultiTenantPhase11780000000001 = MultiTenantPhase11780000000001;
