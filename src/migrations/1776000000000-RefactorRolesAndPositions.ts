import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorRolesAndPositions1776000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar tabela CAEs
    await queryRunner.query(`
      CREATE TABLE caes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        state_id UUID NOT NULL REFERENCES states(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_caes_updated
      BEFORE UPDATE ON caes
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // 2. Criar tabela cae_managers
    await queryRunner.query(`
      CREATE TABLE cae_managers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cae_id UUID NOT NULL REFERENCES caes(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(cae_id, member_id)
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_cae_managers_updated
      BEFORE UPDATE ON cae_managers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // 3. Criar tabela course_managers (dirigentes)
    await queryRunner.query(`
      CREATE TABLE course_managers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        course_university_id UUID NOT NULL REFERENCES course_universities(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        start_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ,
        UNIQUE(course_university_id, member_id)
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_course_managers_updated
      BEFORE UPDATE ON course_managers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // 4. Adicionar cae_id em cars
    await queryRunner.query(`
      ALTER TABLE cars ADD COLUMN cae_id UUID REFERENCES caes(id) ON DELETE SET NULL
    `);

    // 5. Tornar course_university_id nullable em member_courses (para EXTERNOS)
    await queryRunner.query(`
      ALTER TABLE member_courses ALTER COLUMN course_university_id DROP NOT NULL
    `);

    // 6. Limpar roles antigas e manter apenas EXTERNO e EQUIPE_TECNICA
    await queryRunner.query(`
      -- Deletar vínculos de roles que não são EXTERNO ou EQUIPE_TECNICA
      DELETE FROM member_roles 
      WHERE role_id IN (
        SELECT id FROM roles 
        WHERE name NOT IN ('EXTERNO', 'EQUIPE_TECNICA')
      )
    `);

    await queryRunner.query(`
      -- Deletar roles antigas
      DELETE FROM roles 
      WHERE name NOT IN ('EXTERNO', 'EQUIPE_TECNICA')
    `);

    // 7. Garantir que EXTERNO e EQUIPE_TECNICA existem
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      (uuid_generate_v4(), 'EXTERNO', 'Membro externo sem matrícula ativa ou ex-membro'),
      (uuid_generate_v4(), 'EQUIPE_TECNICA', 'Equipe técnica com acesso administrativo total')
      ON CONFLICT (name) DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter em ordem inversa
    await queryRunner.query(`ALTER TABLE cars DROP COLUMN IF EXISTS cae_id`);
    await queryRunner.query(`ALTER TABLE member_courses ALTER COLUMN course_university_id SET NOT NULL`);
    await queryRunner.query(`DROP TABLE IF EXISTS course_managers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS cae_managers CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS caes CASCADE`);
  }
}
