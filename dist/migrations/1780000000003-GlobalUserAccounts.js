"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalUserAccounts17800000000003 = void 0;
class GlobalUserAccounts17800000000003 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE user_accounts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX user_accounts_email_lower_key
        ON user_accounts (lower(email));
    `);
        await queryRunner.query(`
      ALTER TABLE members
        ADD COLUMN account_id UUID,
        ADD CONSTRAINT members_account_id_fkey
          FOREIGN KEY (account_id) REFERENCES user_accounts(id) ON DELETE RESTRICT;
    `);
        await queryRunner.query(`
      INSERT INTO user_accounts (email, password)
      SELECT DISTINCT ON (lower(email_personal))
        lower(email_personal), password
      FROM members
      ORDER BY lower(email_personal), id
      ON CONFLICT (lower(email)) DO NOTHING;
    `);
        await queryRunner.query(`
      UPDATE members AS member
      SET account_id = account.id
      FROM user_accounts AS account
      WHERE lower(member.email_personal) = lower(account.email);
    `);
        await queryRunner.query(`
      ALTER TABLE members
        ALTER COLUMN account_id SET NOT NULL,
        DROP CONSTRAINT IF EXISTS members_email_personal_key,
        DROP CONSTRAINT IF EXISTS members_cpf_key,
        DROP CONSTRAINT IF EXISTS members_email_university_key;
    `);
        await queryRunner.query(`
      CREATE UNIQUE INDEX members_account_organization_key
        ON members (account_id, organization_id);
      CREATE UNIQUE INDEX members_email_organization_key
        ON members (organization_id, lower(email_personal));
      CREATE UNIQUE INDEX members_cpf_organization_key
        ON members (organization_id, cpf);
      CREATE UNIQUE INDEX members_university_email_organization_key
        ON members (organization_id, lower(email_university));
    `);
        await queryRunner.query(`
      CREATE INDEX members_account_id_idx ON members (account_id);
    `);
        await queryRunner.query(`
      CREATE TABLE user_account_roles (
        account_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
        role_name VARCHAR(100) NOT NULL,
        PRIMARY KEY (account_id, role_name)
      );
      INSERT INTO user_account_roles (account_id, role_name)
      SELECT DISTINCT member.account_id, role.name
      FROM members AS member
      JOIN member_roles AS member_role ON member_role.member_id = member.id
      JOIN roles AS role ON role.id = member_role.role_id
      WHERE role.name = 'EQUIPE_TECNICA';
    `);
        await queryRunner.query(`
      INSERT INTO roles (name, description)
      VALUES ('organization.admin', 'Administrador de uma organização')
      ON CONFLICT (name) DO NOTHING;
      CREATE UNIQUE INDEX IF NOT EXISTS member_roles_member_role_key
        ON member_roles (member_id, role_id);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS user_account_roles;`);
        await queryRunner.query(`DROP INDEX IF EXISTS members_account_id_idx;`);
        await queryRunner.query(`DROP INDEX IF EXISTS members_university_email_organization_key;`);
        await queryRunner.query(`DROP INDEX IF EXISTS members_cpf_organization_key;`);
        await queryRunner.query(`DROP INDEX IF EXISTS members_email_organization_key;`);
        await queryRunner.query(`DROP INDEX IF EXISTS members_account_organization_key;`);
        await queryRunner.query(`
      ALTER TABLE members
        DROP CONSTRAINT IF EXISTS members_account_id_fkey,
        DROP COLUMN IF EXISTS account_id;
    `);
        await queryRunner.query(`DROP TABLE IF EXISTS user_accounts;`);
    }
}
exports.GlobalUserAccounts17800000000003 = GlobalUserAccounts17800000000003;
