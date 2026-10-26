import { MigrationInterface, QueryRunner } from 'typeorm';

export class SupportActorAccountOnly17800000000009 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE platform_support_sessions
        ALTER COLUMN actor_member_id DROP NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM platform_support_sessions WHERE actor_member_id IS NULL;
      ALTER TABLE platform_support_sessions
        ALTER COLUMN actor_member_id SET NOT NULL;
    `);
  }
}