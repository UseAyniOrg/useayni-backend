import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMiscellaneous1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Enums (seed de enums: type, visibility, status, scope)
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_type AS ENUM (
        'projeto', 'evento', 'meta', 'reuniao', 'atividade', 'formulario'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_visibility AS ENUM ('publico', 'privado')
    `);
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_status AS ENUM (
        'rascunho', 'ativa', 'pendente_aprovacao'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_scope AS ENUM (
        'meu_nivel', 'car', 'cae', 'geral', 'selecao_individual'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_member_status AS ENUM (
        'pendente', 'aceito', 'recusado'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE public.enum_miscellaneous_notification_type AS ENUM (
        'aprovacao', 'convite', 'confirmacao'
      )
    `);

    // 2. Tabela principal
    await queryRunner.query(`
      CREATE TABLE miscellaneous (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type public.enum_miscellaneous_type NOT NULL,
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        visibility public.enum_miscellaneous_visibility NOT NULL,
        scope public.enum_miscellaneous_scope NOT NULL,
        status public.enum_miscellaneous_status NOT NULL,
        cep VARCHAR(9),
        bairro VARCHAR(255),
        rua VARCHAR(255),
        numero VARCHAR(20),
        cidade VARCHAR(255),
        estado VARCHAR(255),
        cover_photo_url TEXT,
        banner_url TEXT,
        parent_id UUID REFERENCES miscellaneous(id) ON DELETE SET NULL,
        creator_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_miscellaneous_updated
      BEFORE UPDATE ON miscellaneous
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    await queryRunner.query(`
      CREATE INDEX idx_miscellaneous_parent ON miscellaneous(parent_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_miscellaneous_creator ON miscellaneous(creator_id)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_miscellaneous_status ON miscellaneous(status)
    `);

    // 3. Donos (RN-001)
    await queryRunner.query(`
      CREATE TABLE miscellaneous_owners (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        is_primary BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(miscellaneous_id, member_id)
      )
    `);

    // 4. Membros iniciais / convidados (RN-003)
    await queryRunner.query(`
      CREATE TABLE miscellaneous_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        status public.enum_miscellaneous_member_status NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(miscellaneous_id, member_id)
      )
    `);

    await queryRunner.query(`
      CREATE TRIGGER trg_miscellaneous_members_updated
      BEFORE UPDATE ON miscellaneous_members
      FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // 5. Notificações (RN-002/RN-003)
    await queryRunner.query(`
      CREATE TABLE miscellaneous_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        recipient_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        miscellaneous_id UUID REFERENCES miscellaneous(id) ON DELETE CASCADE,
        type public.enum_miscellaneous_notification_type NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_miscellaneous_notifications_recipient
      ON miscellaneous_notifications(recipient_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_notifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_members CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_owners CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_notification_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_member_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_scope`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_visibility`);
    await queryRunner.query(`DROP TYPE IF EXISTS public.enum_miscellaneous_type`);
  }
}
