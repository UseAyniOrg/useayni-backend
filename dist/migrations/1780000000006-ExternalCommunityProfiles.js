"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalCommunityProfiles17800000000006 = void 0;
class ExternalCommunityProfiles17800000000006 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE external_account_profiles (
        account_id UUID PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
        display_name VARCHAR(255) NOT NULL,
        profile_type VARCHAR(20) NOT NULL DEFAULT 'basic'
          CHECK (profile_type IN ('basic', 'academic')),
        phone VARCHAR(20),
        academic_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        additional_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE external_event_registrations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE RESTRICT,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
        profile_type VARCHAR(20) NOT NULL
          CHECK (profile_type IN ('basic', 'academic')),
        shared_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
        registration_data JSONB NOT NULL DEFAULT '{}'::jsonb,
        profile_consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        profile_consent_version VARCHAR(50) NOT NULL DEFAULT 'external-event-v1',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (miscellaneous_id, account_id)
      );

      CREATE INDEX idx_external_event_registrations_org_event
        ON external_event_registrations(organization_id, miscellaneous_id, created_at);
      CREATE INDEX idx_external_event_registrations_account
        ON external_event_registrations(account_id, created_at DESC);

      ALTER TABLE miscellaneous
        ADD COLUMN external_registration_schema JSONB NOT NULL DEFAULT '[]'::jsonb;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE miscellaneous DROP COLUMN IF EXISTS external_registration_schema;
      DROP TABLE IF EXISTS external_event_registrations;
      DROP TABLE IF EXISTS external_account_profiles;
    `);
    }
}
exports.ExternalCommunityProfiles17800000000006 = ExternalCommunityProfiles17800000000006;
