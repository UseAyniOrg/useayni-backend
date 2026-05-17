import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMemberRegistrationReview1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members
        ADD COLUMN IF NOT EXISTS current_semester INTEGER,
        ADD COLUMN IF NOT EXISTS university_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS course_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS current_semester_not_applicable BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS registration_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS registration_reviewed_by UUID REFERENCES members(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS registration_reviewed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS registration_rejection_reason TEXT
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'members_registration_status_check'
        ) THEN
          ALTER TABLE members
            ADD CONSTRAINT members_registration_status_check
            CHECK (registration_status IN ('pending', 'approved', 'rejected'));
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS members_registration_status_idx
      ON members (registration_status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS members_registration_status_idx');
    await queryRunner.query(`
      ALTER TABLE members
        DROP CONSTRAINT IF EXISTS members_registration_status_check,
        DROP COLUMN IF EXISTS registration_rejection_reason,
        DROP COLUMN IF EXISTS registration_reviewed_at,
        DROP COLUMN IF EXISTS registration_reviewed_by,
        DROP COLUMN IF EXISTS registration_status,
        DROP COLUMN IF EXISTS current_semester_not_applicable,
        DROP COLUMN IF EXISTS course_not_applicable,
        DROP COLUMN IF EXISTS university_not_applicable,
        DROP COLUMN IF EXISTS current_semester
    `);
  }
}
