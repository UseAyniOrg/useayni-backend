import { MigrationInterface, QueryRunner } from 'typeorm';

export class MiscellaneousScopeIdsAndFormRefactor1779005000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fix miscellaneous_owners: add role + is_creator if missing
    const ownerCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous_owners'
    `);
    const oc = new Set(ownerCols.map((r: any) => r.column_name));
    if (!oc.has('role')) {
      await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'owner'`);
    }
    if (!oc.has('is_creator')) {
      await queryRunner.query(`ALTER TABLE miscellaneous_owners ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT FALSE`);
      if (oc.has('is_primary')) {
        await queryRunner.query(`UPDATE miscellaneous_owners SET is_creator = is_primary`);
      }
    }
    if (oc.has('is_primary')) {
      await queryRunner.query(`ALTER TABLE miscellaneous_owners DROP COLUMN is_primary`);
    }

    // Add scope_ids to miscellaneous (stores selected entity IDs for granular scopes)
    const miscCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous'
    `);
    const mc = new Set(miscCols.map((r: any) => r.column_name));
    if (!mc.has('scope_ids')) {
      await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN scope_ids JSONB`);
    }

    // Add response_limit_type to forms
    const formCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'forms'
    `);
    const fc = new Set(formCols.map((r: any) => r.column_name));
    if (!fc.has('response_limit_type')) {
      await queryRunner.query(`ALTER TABLE forms ADD COLUMN response_limit_type VARCHAR(20) NOT NULL DEFAULT 'unlimited'`);
    }
    if (!fc.has('public_results_enabled') ) {
      await queryRunner.query(`ALTER TABLE forms ADD COLUMN public_results_enabled BOOLEAN NOT NULL DEFAULT FALSE`);
    }
    if (!fc.has('public_slug')) {
      await queryRunner.query(`ALTER TABLE forms ADD COLUMN public_slug VARCHAR(255) UNIQUE`);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {}
}
