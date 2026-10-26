import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMiscellaneousMissingColumns1779001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous'
    `);
    const existing = new Set(rows.map((r: any) => r.column_name));

    const cols: [string, string][] = [
      ['end_date',                'TIMESTAMPTZ'],
      ['location_zip',            'VARCHAR(10)'],
      ['location_street',         'VARCHAR(255)'],
      ['location_number',         'VARCHAR(10)'],
      ['location_neighborhood',   'VARCHAR(100)'],
      ['location_city',           'VARCHAR(100)'],
      ['location_state',          'VARCHAR(2)'],
      ['cover_url',               'TEXT'],
      ['banner_url',              'TEXT'],
      ['public_slug',             'VARCHAR(255)'],
    ];

    for (const [col, def] of cols) {
      if (!existing.has(col)) {
        await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN ${col} ${def}`);
      }
    }

    // public_slug must be unique
    const constraints = await queryRunner.query(`
      SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_name = 'miscellaneous' AND constraint_type = 'UNIQUE'
    `);
    const hasSlugUnique = constraints.some((c: any) =>
      c.constraint_name.includes('public_slug') || c.constraint_name.includes('slug')
    );
    if (!hasSlugUnique && existing.has('public_slug') === false) {
      await queryRunner.query(`ALTER TABLE miscellaneous ADD CONSTRAINT miscellaneous_public_slug_unique UNIQUE (public_slug)`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cols = ['end_date', 'location_zip', 'location_street', 'location_number',
      'location_neighborhood', 'location_city', 'location_state', 'cover_url', 'banner_url', 'public_slug'];
    for (const col of cols) {
      await queryRunner.query(`ALTER TABLE miscellaneous DROP COLUMN IF EXISTS ${col}`);
    }
  }
}
