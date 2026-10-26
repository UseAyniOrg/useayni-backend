import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationRegistrationFields17800000000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members
        ALTER COLUMN phone DROP NOT NULL,
        ALTER COLUMN cpf DROP NOT NULL,
        ALTER COLUMN email_university DROP NOT NULL,
        ALTER COLUMN ra DROP NOT NULL,
        ALTER COLUMN birth_date DROP NOT NULL,
        ALTER COLUMN admission_date DROP NOT NULL;
    `);
    await queryRunner.query(`
      INSERT INTO member_custom_field_values (member_id, field_key, value)
      SELECT member.id, field.field_key, field.value
      FROM members AS member
      CROSS JOIN LATERAL (
        VALUES
          ('cpf', member.cpf::text),
          ('ra', member.ra::text),
          ('email_university', member.email_university::text),
          ('admission_date', to_char(member.admission_date, 'YYYY-MM-DD'))
      ) AS field(field_key, value)
      JOIN member_custom_field_definitions AS definition
        ON definition.organization_id = member.organization_id
       AND definition.field_key = field.field_key
      WHERE field.value IS NOT NULL
      ON CONFLICT (member_id, field_key) DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE members
        ALTER COLUMN phone SET NOT NULL,
        ALTER COLUMN cpf SET NOT NULL,
        ALTER COLUMN email_university SET NOT NULL,
        ALTER COLUMN ra SET NOT NULL,
        ALTER COLUMN birth_date SET NOT NULL,
        ALTER COLUMN admission_date SET NOT NULL;
    `);
  }
}
