import { MigrationInterface, QueryRunner } from 'typeorm';

export class MemberLegacyFields17800000000011 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS current_semester INTEGER,
        ADD COLUMN IF NOT EXISTS university_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS course_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS current_semester_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS registration_reviewed_by UUID,
        ADD COLUMN IF NOT EXISTS registration_reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS registration_rejection_reason TEXT;

      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'members_registration_reviewed_by_fkey'
        ) THEN
          ALTER TABLE members
            ADD CONSTRAINT members_registration_reviewed_by_fkey
            FOREIGN KEY (registration_reviewed_by) REFERENCES members(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members
        DROP CONSTRAINT IF EXISTS members_registration_reviewed_by_fkey,
        DROP COLUMN IF EXISTS registration_rejection_reason,
        DROP COLUMN IF EXISTS registration_reviewed_at,
        DROP COLUMN IF EXISTS registration_reviewed_by,
        DROP COLUMN IF EXISTS current_semester_not_applicable,
        DROP COLUMN IF EXISTS course_not_applicable,
        DROP COLUMN IF EXISTS university_not_applicable,
        DROP COLUMN IF EXISTS current_semester;
    `);
  }
}