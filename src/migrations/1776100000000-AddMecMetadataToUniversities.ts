import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMecMetadataToUniversities1776100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE universities
        ADD COLUMN IF NOT EXISTS emec_code VARCHAR(30),
        ADD COLUMN IF NOT EXISTS source VARCHAR(50),
        ADD COLUMN IF NOT EXISTS category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100),
        ADD COLUMN IF NOT EXISTS status VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS universities_emec_code_key
      ON universities (emec_code)
      WHERE emec_code IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cities_ibge_code_key
      ON cities (ibge_code)
      WHERE ibge_code IS NOT NULL
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'trg_universities_updated'
        ) THEN
          CREATE TRIGGER trg_universities_updated
          BEFORE UPDATE ON universities
          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS trg_universities_updated ON universities');
    await queryRunner.query('DROP INDEX IF EXISTS cities_ibge_code_key');
    await queryRunner.query('DROP INDEX IF EXISTS universities_emec_code_key');
    await queryRunner.query(`
      ALTER TABLE universities
        DROP COLUMN IF EXISTS updated_at,
        DROP COLUMN IF EXISTS created_at,
        DROP COLUMN IF EXISTS city_id,
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS organization_type,
        DROP COLUMN IF EXISTS category,
        DROP COLUMN IF EXISTS source,
        DROP COLUMN IF EXISTS emec_code
    `);
  }
}
