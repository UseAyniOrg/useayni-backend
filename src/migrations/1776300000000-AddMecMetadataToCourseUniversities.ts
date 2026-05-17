import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMecMetadataToCourseUniversities1776300000000 implements MigrationInterface {
  name = "AddMecMetadataToCourseUniversities1776300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "course_universities"
      ADD COLUMN IF NOT EXISTS "external_course_id" character varying(50),
      ADD COLUMN IF NOT EXISTS "source" character varying(50),
      ADD COLUMN IF NOT EXISTS "degree_type" character varying(100),
      ADD COLUMN IF NOT EXISTS "modality" character varying(100),
      ADD COLUMN IF NOT EXISTS "academic_level" character varying(100)
    `);

    await queryRunner.query(`
      DELETE FROM "course_universities" cu
      USING (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (
                   PARTITION BY course_id, university_id, city_id
                   ORDER BY id
                 ) AS row_number
          FROM "course_universities"
        ) duplicated
        WHERE duplicated.row_number > 1
      ) duplicated
      WHERE cu.id = duplicated.id
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "course_universities_course_university_city_key"
      ON "course_universities" ("course_id", "university_id", "city_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "course_universities_external_course_id_idx"
      ON "course_universities" ("external_course_id")
      WHERE "external_course_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "course_universities_external_course_id_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "course_universities_course_university_city_key"`);
    await queryRunner.query(`
      ALTER TABLE "course_universities"
      DROP COLUMN IF EXISTS "academic_level",
      DROP COLUMN IF EXISTS "modality",
      DROP COLUMN IF EXISTS "degree_type",
      DROP COLUMN IF EXISTS "source",
      DROP COLUMN IF EXISTS "external_course_id"
    `);
  }
}
