import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransactionalEmail1793000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE email_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
        kind varchar(100) NOT NULL,
        recipient varchar(255) NOT NULL,
        dedupe_key varchar(512) UNIQUE NOT NULL,
        payload text,
        priority integer NOT NULL DEFAULT 10,
        provider varchar(30) NOT NULL,
        message_id text,
        status varchar(30) NOT NULL DEFAULT 'queued',
        delivery_status varchar(30),
        attempts integer NOT NULL DEFAULT 0,
        next_attempt_at timestamptz NOT NULL DEFAULT now(),
        lease_until timestamptz,
        expires_at timestamptz,
        accepted_at timestamptz,
        delivered_at timestamptz,
        error_code varchar(50),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX email_messages_queue_idx ON email_messages (priority, next_attempt_at) WHERE status = 'queued';
      CREATE UNIQUE INDEX email_messages_provider_id_idx ON email_messages(provider, message_id) WHERE message_id IS NOT NULL;
      CREATE INDEX email_messages_usage_idx ON email_messages (organization_id, created_at);
      CREATE TABLE email_attempts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
        outcome varchar(50) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE email_provider_events (
        fingerprint varchar(64) PRIMARY KEY,
        provider varchar(30) NOT NULL,
        message_id text NOT NULL,
        event varchar(40) NOT NULL,
        occurred_at timestamptz NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE email_suppressions (
        recipient varchar(255) PRIMARY KEY,
        reason varchar(50) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE user_accounts ADD COLUMN email_verified_at timestamptz;
      CREATE TABLE account_email_challenges (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
        email varchar(255) NOT NULL,
        purpose varchar(40) NOT NULL,
        token_hash varchar(64) UNIQUE NOT NULL,
        expires_at timestamptz NOT NULL,
        consumed_at timestamptz,
        attempts integer NOT NULL DEFAULT 0,
        metadata jsonb NOT NULL DEFAULT '{}',
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX account_email_challenges_rate_idx ON account_email_challenges (email, purpose, created_at);
      CREATE TABLE email_preferences (
        account_id uuid NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
        organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        category varchar(40) NOT NULL,
        enabled boolean NOT NULL,
        PRIMARY KEY (account_id, organization_id, category)
      );
      CREATE TABLE email_rate_limits (
        bucket varchar(64) PRIMARY KEY,
        attempts integer NOT NULL,
        expires_at timestamptz NOT NULL
      );
      CREATE TABLE transactional_email_feature_backup (
        organization_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
        enabled boolean NOT NULL,
        config jsonb NOT NULL
      );
      INSERT INTO transactional_email_feature_backup(organization_id, enabled, config)
        SELECT organization_id, enabled, config FROM organization_features WHERE feature_slug='communication_email';
      INSERT INTO organization_features (organization_id, feature_slug, enabled, config)
        SELECT id, 'communication_email', true, '{}'::jsonb FROM organizations WHERE deleted_at IS NULL
        ON CONFLICT (organization_id, feature_slug) DO UPDATE SET enabled=true;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM organization_features current_feature
      WHERE current_feature.feature_slug='communication_email'
        AND NOT EXISTS (SELECT 1 FROM transactional_email_feature_backup previous
          WHERE previous.organization_id=current_feature.organization_id);
      UPDATE organization_features current_feature SET enabled=previous.enabled, config=previous.config
        FROM transactional_email_feature_backup previous
        WHERE current_feature.organization_id=previous.organization_id
          AND current_feature.feature_slug='communication_email';
      DROP TABLE transactional_email_feature_backup;
      DROP TABLE email_rate_limits, email_preferences, account_email_challenges, email_suppressions,
      email_provider_events, email_attempts, email_messages;
      ALTER TABLE user_accounts DROP COLUMN email_verified_at;`);
  }
}