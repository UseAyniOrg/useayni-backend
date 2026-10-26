import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemporaryPasswordSetup17800000000012 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_accounts
        ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN NOT NULL DEFAULT false;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE user_accounts DROP COLUMN IF EXISTS password_change_required;`);
  }
}