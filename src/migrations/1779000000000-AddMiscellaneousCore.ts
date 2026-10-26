import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMiscellaneousCore1779000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(120) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'draft',
        visibility VARCHAR(20) NOT NULL,
        scope VARCHAR(20) NOT NULL,
        start_date TIMESTAMPTZ NOT NULL,
        end_date TIMESTAMPTZ,
        location_zip VARCHAR(10),
        location_street VARCHAR(255),
        location_number VARCHAR(10),
        location_neighborhood VARCHAR(100),
        location_city VARCHAR(100),
        location_state VARCHAR(2),
        cover_url TEXT,
        banner_url TEXT,
        public_slug VARCHAR(255) UNIQUE,
        public_access_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        stream_link TEXT,
        capacity_presential INT,
        capacity_online INT,
        meeting_link TEXT,
        agenda TEXT,
        goal_target NUMERIC,
        goal_unit VARCHAR(50),
        goal_progress NUMERIC,
        activity_status VARCHAR(20),
        activity_priority VARCHAR(10),
        registration_start_date TIMESTAMPTZ,
        registration_end_date TIMESTAMPTZ,
        max_members INT,
        waitlist_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        waitlist_message TEXT,
        parent_id UUID REFERENCES miscellaneous(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES members(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at TIMESTAMPTZ
      );
    `);

    // Add missing columns if the table already existed with an older schema
    const miscCols = await queryRunner.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'miscellaneous'
    `);
    const existingCols = new Set(miscCols.map((r: any) => r.column_name));

    const colsToAdd: [string, string][] = [
      ['visibility',               "VARCHAR(20) NOT NULL DEFAULT 'public'"],
      ['scope',                    "VARCHAR(20) NOT NULL DEFAULT 'internal'"],
      ['end_date',                 'TIMESTAMPTZ'],
      ['location_zip',             'VARCHAR(10)'],
      ['location_street',          'VARCHAR(255)'],
      ['location_number',          'VARCHAR(10)'],
      ['location_neighborhood',    'VARCHAR(100)'],
      ['location_city',            'VARCHAR(100)'],
      ['location_state',           'VARCHAR(2)'],
      ['cover_url',                'TEXT'],
      ['banner_url',               'TEXT'],
      ['public_slug',              'VARCHAR(255) UNIQUE'],
      ['public_access_enabled',    'BOOLEAN NOT NULL DEFAULT FALSE'],
      ['stream_link',              'TEXT'],
      ['capacity_presential',      'INT'],
      ['capacity_online',          'INT'],
      ['meeting_link',             'TEXT'],
      ['agenda',                   'TEXT'],
      ['goal_target',              'NUMERIC'],
      ['goal_unit',                'VARCHAR(50)'],
      ['goal_progress',            'NUMERIC'],
      ['activity_status',          'VARCHAR(20)'],
      ['activity_priority',        'VARCHAR(10)'],
      ['registration_start_date',  'TIMESTAMPTZ'],
      ['registration_end_date',    'TIMESTAMPTZ'],
      ['max_members',              'INT'],
      ['waitlist_enabled',         'BOOLEAN NOT NULL DEFAULT FALSE'],
      ['waitlist_message',         'TEXT'],
      ['parent_id',                'UUID REFERENCES miscellaneous(id) ON DELETE SET NULL'],
      ['created_by',               'UUID REFERENCES members(id)'],
      ['deleted_at',               'TIMESTAMPTZ'],
    ];

    for (const [col, definition] of colsToAdd) {
      if (!existingCols.has(col)) {
        await queryRunner.query(`ALTER TABLE miscellaneous ADD COLUMN ${col} ${definition}`);
      }
    }

    // If created_by was just added (nullable), delete orphan rows and enforce NOT NULL
    if (!existingCols.has('created_by')) {
      await queryRunner.query(`DELETE FROM miscellaneous WHERE created_by IS NULL`);
      await queryRunner.query(`ALTER TABLE miscellaneous ALTER COLUMN created_by SET NOT NULL`);
    }

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_misc_type ON miscellaneous(type);
      CREATE INDEX IF NOT EXISTS idx_misc_status ON miscellaneous(status);
    `);
    if (existingCols.has('created_by') || !existingCols.has('created_by')) {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_misc_created_by ON miscellaneous(created_by)`);
    }
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_misc_parent_id ON miscellaneous(parent_id)`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_misc_created_at ON miscellaneous(created_at)`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_owners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'owner',
        is_creator BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(miscellaneous_id, member_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(miscellaneous_id, member_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_waitlist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        position INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'waiting',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(miscellaneous_id, member_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        response_message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        reviewed_by UUID REFERENCES members(id),
        reviewed_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_misc_requests_status ON miscellaneous_requests(status);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_invites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        invited_by_user_id UUID NOT NULL REFERENCES members(id),
        invited_user_id UUID NOT NULL REFERENCES members(id),
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        rejection_reason TEXT,
        expires_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(miscellaneous_id, invited_user_id, status)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS miscellaneous_approval_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        actor_user_id UUID NOT NULL REFERENCES members(id),
        action VARCHAR(20) NOT NULL,
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        mode VARCHAR(20) NOT NULL,
        starts_at TIMESTAMPTZ NOT NULL,
        ends_at TIMESTAMPTZ NOT NULL,
        created_by UUID NOT NULL REFERENCES members(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS attendance_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id),
        present BOOLEAN NOT NULL DEFAULT TRUE,
        checked_in_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(session_id, member_id)
      );

      CREATE TABLE IF NOT EXISTS attendance_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        member_id UUID NOT NULL REFERENCES members(id),
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(session_id, member_id)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        anonymous BOOLEAN NOT NULL DEFAULT FALSE,
        max_responses_per_user INT,
        results_visibility VARCHAR(20) NOT NULL DEFAULT 'owner',
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        public_results_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        public_slug VARCHAR(255) UNIQUE,
        miscellaneous_id UUID REFERENCES miscellaneous(id) ON DELETE SET NULL,
        created_by UUID NOT NULL REFERENCES members(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        required BOOLEAN NOT NULL DEFAULT FALSE,
        position INT NOT NULL,
        scale_min INT,
        scale_max INT
      );

      CREATE TABLE IF NOT EXISTS form_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        question_id UUID NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
        label VARCHAR(255) NOT NULL,
        position INT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS form_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
        member_id UUID REFERENCES members(id),
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS form_answers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id UUID NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES form_questions(id),
        value TEXT
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS external_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        institution VARCHAR(255),
        course VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(2),
        miscellaneous_id UUID NOT NULL REFERENCES miscellaneous(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS external_profiles CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_answers CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_responses CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_options CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS form_questions CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS forms CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS attendance_tokens CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS attendance_records CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS attendance_sessions CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_approval_logs CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_invites CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_requests CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_waitlist CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_participants CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous_owners CASCADE;`);
    await queryRunner.query(`DROP TABLE IF EXISTS miscellaneous CASCADE;`);
  }
}
