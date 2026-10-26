import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixMiscellaneousEnumToVarchar1779002000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check which columns are still enum type and convert them to varchar
    const enumCols = await queryRunner.query(`
      SELECT column_name, udt_name
      FROM information_schema.columns
      WHERE table_name = 'miscellaneous'
        AND table_schema = 'public'
        AND data_type = 'USER-DEFINED'
    `);

    for (const { column_name, udt_name } of enumCols) {
      await queryRunner.query(`
        ALTER TABLE miscellaneous
        ALTER COLUMN "${column_name}" TYPE VARCHAR
        USING "${column_name}"::TEXT
      `);
      // Drop the orphan enum type if no other column uses it
      await queryRunner.query(`DROP TYPE IF EXISTS "${udt_name}" CASCADE`).catch(() => {});
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally not reverting — keeping varchar is the correct state
  }
}
