import { MigrationInterface, QueryRunner } from 'typeorm';

export class RestoreMemberAcademicRelations17800000000013 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE course_universities
        ADD COLUMN IF NOT EXISTS external_course_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS degree_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS modality VARCHAR(100),
        ADD COLUMN IF NOT EXISTS academic_level VARCHAR(100)
    `);
    await queryRunner.query(`
      ALTER TABLE universities
        ADD COLUMN IF NOT EXISTS emec_code VARCHAR(30),
        ADD COLUMN IF NOT EXISTS source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL
    `);
  }

  async down(): Promise<void> {
    throw new Error('Migração de reparo não reversível automaticamente: as colunas podem conter dados anteriores ao reparo.');
  }
}
