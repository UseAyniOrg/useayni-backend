import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1775599556976 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner:
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: enum_enrollment_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_enrollment_status AS ENUM (
    'active',
    'approved',
    'failed',
    'suspended',
    'cancelled'
);



--
-- Name: enum_member_course_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_member_course_status AS ENUM (
    'active',
    'suspended',
    'completed',
    'cancelled'
);



--
-- Name: enum_semester_offering_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.enum_semester_offering_status AS ENUM (
    'planned',
    'active',
    'closed',
    'cancelled',
    'paused'
);



--
-- Name: goal_type_enum; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.goal_type_enum AS ENUM (
    'Aquisi├º├úo de membros',
    'Participar de Projetos',
    'Presen├ºa em reuni├Áes'
);



--
-- Name: project_member_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.project_member_status AS ENUM (
    'Pendente',
    'Aceito',
    'Recusado'
);



--
-- Name: skills_status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public.skills_status AS ENUM (
    'Pendente',
    'Aprovado'
);



--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: neondb_owner
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$;



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: academic_terms; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.academic_terms (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    year character varying(10) NOT NULL,
    term character varying(10) NOT NULL,
    starts_at date,
    ends_at date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: car_cities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.car_cities (
    car_id uuid NOT NULL,
    city_id uuid NOT NULL
);



--
-- Name: car_managers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.car_managers (
    car_id uuid NOT NULL,
    member_id uuid NOT NULL
);



--
-- Name: cars; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: cities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    ibge_code character varying(10),
    state_id uuid NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: course_universities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.course_universities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    university_id uuid NOT NULL,
    city_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: courses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: enrollments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.enrollments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid NOT NULL,
    semester_offering_id uuid NOT NULL,
    status public.enum_enrollment_status DEFAULT 'active'::public.enum_enrollment_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: event_attendance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.event_attendance (
    event_id uuid NOT NULL,
    member_id uuid NOT NULL,
    status character varying(20)
);



--
-- Name: events; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.events (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    banner text,
    image text,
    link character varying(255),
    start_date date NOT NULL,
    end_date date,
    responsible_id uuid NOT NULL,
    project_id uuid,
    location text
);



--
-- Name: goal_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goal_members (
    goal_id uuid NOT NULL,
    member_id uuid NOT NULL
);



--
-- Name: goals; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    goal_type public.goal_type_enum NOT NULL,
    parameter integer NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    creator_id uuid,
    CONSTRAINT goals_goal_type_check CHECK (((goal_type)::text = ANY (ARRAY[('Aquisi├º├úo de membros'::character varying)::text, ('Participar de Projetos'::character varying)::text, ('Presen├ºa em reuni├Áes'::character varying)::text])))
);



--
-- Name: meeting_attendance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.meeting_attendance (
    meeting_id uuid NOT NULL,
    member_id uuid NOT NULL,
    status character varying(20),
    CONSTRAINT meeting_attendance_status_check CHECK (((status)::text = ANY (ARRAY[('Presente'::character varying)::text, ('Ausente'::character varying)::text])))
);



--
-- Name: meetings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.meetings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    date_time timestamp without time zone NOT NULL,
    location character varying(255),
    link character varying(255)
);



--
-- Name: member_courses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.member_courses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid NOT NULL,
    course_university_id uuid NOT NULL,
    status public.enum_member_course_status DEFAULT 'active'::public.enum_member_course_status NOT NULL,
    started_at date DEFAULT CURRENT_DATE,
    completed_at date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: member_roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.member_roles (
    member_id uuid NOT NULL,
    role_id uuid NOT NULL
);



--
-- Name: members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    cpf character varying(14) NOT NULL,
    phone character varying(20) NOT NULL,
    email_personal character varying(255) NOT NULL,
    email_university character varying(255) NOT NULL,
    profile_picture_url text,
    birth_date date NOT NULL,
    admission_date date NOT NULL,
    sponsor uuid,
    biography character varying(2600),
    banner_url character varying(255),
    curriculum_url character varying(255),
    youtube_url character varying(255),
    twitter_url character varying(255),
    instagram_url character varying(255),
    linkedin_url character varying(255),
    github_url character varying(255),
    password character varying(255) NOT NULL,
    ra character varying(40) NOT NULL,
    creation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slug character varying(255),
    city_id uuid,
    deleted_at timestamp with time zone
);



--
-- Name: COLUMN members.ra; Type: COMMENT; Schema: public; Owner: neondb_owner
--

COMMENT ON COLUMN public.members.ra IS 'Registro de aluno gerado pela universidade';


--
-- Name: members_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.members_skills (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    member_id uuid,
    skill_id uuid,
    date_add timestamp without time zone DEFAULT now()
);



--
-- Name: migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    "timestamp" bigint NOT NULL,
    name character varying NOT NULL
);



--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.permissions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255),
    resource character varying(50) NOT NULL,
    action character varying(50) NOT NULL
);



--
-- Name: program_semester_heads; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.program_semester_heads (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    program_semester_id uuid NOT NULL,
    member_id uuid NOT NULL,
    start_date date DEFAULT CURRENT_DATE,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: program_semesters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.program_semesters (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_id uuid NOT NULL,
    semester_number integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: project_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_members (
    project_id uuid NOT NULL,
    member_id uuid NOT NULL,
    reason text,
    status public.project_member_status DEFAULT 'Pendente'::public.project_member_status NOT NULL
);



--
-- Name: project_tasks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    title character varying(255) NOT NULL,
    date date NOT NULL,
    description text NOT NULL,
    is_open boolean NOT NULL,
    done boolean DEFAULT false
);



--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text NOT NULL,
    leader_id uuid,
    is_selective boolean NOT NULL,
    date date NOT NULL,
    done boolean DEFAULT false,
    location character varying(255) NOT NULL
);



--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL
);



--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(50) NOT NULL,
    description character varying(255)
);



--
-- Name: semester_offerings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.semester_offerings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    course_university_id uuid NOT NULL,
    program_semester_id uuid NOT NULL,
    academic_term_id uuid NOT NULL,
    status public.enum_semester_offering_status DEFAULT 'planned'::public.enum_semester_offering_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.skills (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    status public.skills_status DEFAULT 'Pendente'::public.skills_status NOT NULL
);



--
-- Name: states; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.states (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    uf character varying(2) NOT NULL,
    deleted_at timestamp with time zone
);



--
-- Name: task_responsibles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.task_responsibles (
    task_id uuid NOT NULL,
    member_id uuid NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT task_responsibles_status_check CHECK (((status)::text = ANY (ARRAY[('Pendente'::character varying)::text, ('Aceito'::character varying)::text, ('Recusado'::character varying)::text])))
);



--
-- Name: token; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.token (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    "memberId" uuid NOT NULL,
    "expiresAt" timestamp without time zone NOT NULL,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type character varying(20) DEFAULT 'access'::character varying NOT NULL
);



--
-- Name: universities; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.universities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    acronym character varying(50),
    deleted_at timestamp with time zone
);



--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: states PK_09ab30ca0975c02656483265f4f; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT "PK_09ab30ca0975c02656483265f4f" PRIMARY KEY (id);


--
-- Name: courses PK_3f70a487cc718ad8eda4e6d58c9; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY (id);


--
-- Name: cities PK_4762ffb6e5d198cfec5606bc11e; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY (id);


--
-- Name: migrations PK_8c82d7f526340ab734260ea46be; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY (id);


--
-- Name: universities PK_8da52f2cee6b407559fdbabf59e; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT "PK_8da52f2cee6b407559fdbabf59e" PRIMARY KEY (id);


--
-- Name: permissions PK_920331560282b8bd21bb02290df; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: cars PK_fc218aa84e79b477d55322271b6; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cars
    ADD CONSTRAINT "PK_fc218aa84e79b477d55322271b6" PRIMARY KEY (id);


--
-- Name: states UQ_356bc6032cbfb292908c465bb5e; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.states
    ADD CONSTRAINT "UQ_356bc6032cbfb292908c465bb5e" UNIQUE (uf);


--
-- Name: permissions UQ_48ce552495d14eae9b187bb6716; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE (name);


--
-- Name: roles UQ_648e3f5447f725579d7d4ffdfb7; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE (name);


--
-- Name: academic_terms academic_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_pkey PRIMARY KEY (id);


--
-- Name: academic_terms academic_terms_year_term_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_year_term_key UNIQUE (year, term);


--
-- Name: course_universities course_universities_course_id_university_id_city_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_universities
    ADD CONSTRAINT course_universities_course_id_university_id_city_id_key UNIQUE (course_id, university_id, city_id);


--
-- Name: course_universities course_universities_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_universities
    ADD CONSTRAINT course_universities_pkey PRIMARY KEY (id);


--
-- Name: enrollments enrollments_member_id_semester_offering_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_member_id_semester_offering_id_key UNIQUE (member_id, semester_offering_id);


--
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- Name: event_attendance event_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_pkey PRIMARY KEY (event_id, member_id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: goal_members goal_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT goal_members_pkey PRIMARY KEY (goal_id, member_id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: meeting_attendance meeting_attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_attendance
    ADD CONSTRAINT meeting_attendance_pkey PRIMARY KEY (meeting_id, member_id);


--
-- Name: meetings meetings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meetings
    ADD CONSTRAINT meetings_pkey PRIMARY KEY (id);


--
-- Name: member_courses member_courses_member_id_course_university_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_courses
    ADD CONSTRAINT member_courses_member_id_course_university_id_key UNIQUE (member_id, course_university_id);


--
-- Name: member_courses member_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_courses
    ADD CONSTRAINT member_courses_pkey PRIMARY KEY (id);


--
-- Name: members members_cpf_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_cpf_key UNIQUE (cpf);


--
-- Name: members members_email_personal_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_email_personal_key UNIQUE (email_personal);


--
-- Name: members members_email_university_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_email_university_key UNIQUE (email_university);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: members_skills members_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members_skills
    ADD CONSTRAINT members_skills_pkey PRIMARY KEY (id);


--
-- Name: program_semester_heads program_semester_heads_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semester_heads
    ADD CONSTRAINT program_semester_heads_pkey PRIMARY KEY (id);


--
-- Name: program_semesters program_semesters_course_id_semester_number_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semesters
    ADD CONSTRAINT program_semesters_course_id_semester_number_key UNIQUE (course_id, semester_number);


--
-- Name: program_semesters program_semesters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semesters
    ADD CONSTRAINT program_semesters_pkey PRIMARY KEY (id);


--
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (project_id, member_id);


--
-- Name: project_tasks project_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tasks
    ADD CONSTRAINT project_tasks_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: semester_offerings semester_offerings_course_university_id_program_semester_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semester_offerings
    ADD CONSTRAINT semester_offerings_course_university_id_program_semester_id_key UNIQUE (course_university_id, program_semester_id, academic_term_id);


--
-- Name: semester_offerings semester_offerings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semester_offerings
    ADD CONSTRAINT semester_offerings_pkey PRIMARY KEY (id);


--
-- Name: skills skills_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_name_key UNIQUE (name);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: task_responsibles task_responsibles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_responsibles
    ADD CONSTRAINT task_responsibles_pkey PRIMARY KEY (task_id, member_id);


--
-- Name: token token_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.token
    ADD CONSTRAINT token_pkey PRIMARY KEY (id);


--
-- Name: academic_terms trg_academic_terms_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_academic_terms_updated BEFORE UPDATE ON public.academic_terms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: course_universities trg_course_universities_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_course_universities_updated BEFORE UPDATE ON public.course_universities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: enrollments trg_enrollments_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: member_courses trg_member_courses_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_member_courses_updated BEFORE UPDATE ON public.member_courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_semester_heads trg_program_semester_heads_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_program_semester_heads_updated BEFORE UPDATE ON public.program_semester_heads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: program_semesters trg_program_semesters_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_program_semesters_updated BEFORE UPDATE ON public.program_semesters FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: semester_offerings trg_semester_offerings_updated; Type: TRIGGER; Schema: public; Owner: neondb_owner
--

CREATE TRIGGER trg_semester_offerings_updated BEFORE UPDATE ON public.semester_offerings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: cities FK_1229b56aa12cae674b824fccd13; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT "FK_1229b56aa12cae674b824fccd13" FOREIGN KEY (state_id) REFERENCES public.states(id) ON DELETE CASCADE;


--
-- Name: role_permissions FK_17022daf3f885f7d35423e9971e; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions FK_178199805b901ccd220ab7740ec; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: car_managers FK_3f4ffe42d4a3d8c9ee9afb481bd; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.car_managers
    ADD CONSTRAINT "FK_3f4ffe42d4a3d8c9ee9afb481bd" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: car_cities FK_aa73603ec9edea7e90ca7b6c238; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.car_cities
    ADD CONSTRAINT "FK_aa73603ec9edea7e90ca7b6c238" FOREIGN KEY (car_id) REFERENCES public.cars(id) ON DELETE CASCADE;


--
-- Name: car_managers FK_bc69c853b186d6d39e13792a405; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.car_managers
    ADD CONSTRAINT "FK_bc69c853b186d6d39e13792a405" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_roles FK_d2a7fdeb2a87338df1362a0bfbf; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT "FK_d2a7fdeb2a87338df1362a0bfbf" FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: car_cities FK_d36d35258adbd7e18a9834c2368; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.car_cities
    ADD CONSTRAINT "FK_d36d35258adbd7e18a9834c2368" FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: member_roles FK_e9080e7a7997a0170026d5139c1; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_roles
    ADD CONSTRAINT "FK_e9080e7a7997a0170026d5139c1" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: members FK_fb20efab0b958b100aa5f6aaa52; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "FK_fb20efab0b958b100aa5f6aaa52" FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: course_universities course_universities_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_universities
    ADD CONSTRAINT course_universities_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: course_universities course_universities_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_universities
    ADD CONSTRAINT course_universities_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_universities course_universities_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_universities
    ADD CONSTRAINT course_universities_university_id_fkey FOREIGN KEY (university_id) REFERENCES public.universities(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: enrollments enrollments_semester_offering_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_semester_offering_id_fkey FOREIGN KEY (semester_offering_id) REFERENCES public.semester_offerings(id) ON DELETE CASCADE;


--
-- Name: event_attendance event_attendance_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_attendance event_attendance_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.event_attendance
    ADD CONSTRAINT event_attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: events events_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: events events_responsible_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: goal_members goal_members_goal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT goal_members_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE CASCADE;


--
-- Name: goal_members goal_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goal_members
    ADD CONSTRAINT goal_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: goals goals_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: meeting_attendance meeting_attendance_meeting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_attendance
    ADD CONSTRAINT meeting_attendance_meeting_id_fkey FOREIGN KEY (meeting_id) REFERENCES public.meetings(id) ON DELETE CASCADE;


--
-- Name: meeting_attendance meeting_attendance_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.meeting_attendance
    ADD CONSTRAINT meeting_attendance_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: token memberId; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.token
    ADD CONSTRAINT "memberId" FOREIGN KEY ("memberId") REFERENCES public.members(id) NOT VALID;


--
-- Name: member_courses member_courses_course_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_courses
    ADD CONSTRAINT member_courses_course_university_id_fkey FOREIGN KEY (course_university_id) REFERENCES public.course_universities(id) ON DELETE CASCADE;


--
-- Name: member_courses member_courses_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.member_courses
    ADD CONSTRAINT member_courses_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: members_skills members_skills_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members_skills
    ADD CONSTRAINT members_skills_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: members_skills members_skills_skill_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members_skills
    ADD CONSTRAINT members_skills_skill_id_fkey FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: members members_sponsor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_sponsor_fkey FOREIGN KEY (sponsor) REFERENCES public.members(id);


--
-- Name: program_semester_heads program_semester_heads_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semester_heads
    ADD CONSTRAINT program_semester_heads_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: program_semester_heads program_semester_heads_program_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semester_heads
    ADD CONSTRAINT program_semester_heads_program_semester_id_fkey FOREIGN KEY (program_semester_id) REFERENCES public.program_semesters(id) ON DELETE CASCADE;


--
-- Name: program_semesters program_semesters_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.program_semesters
    ADD CONSTRAINT program_semesters_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_tasks project_tasks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tasks
    ADD CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: semester_offerings semester_offerings_academic_term_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semester_offerings
    ADD CONSTRAINT semester_offerings_academic_term_id_fkey FOREIGN KEY (academic_term_id) REFERENCES public.academic_terms(id) ON DELETE CASCADE;


--
-- Name: semester_offerings semester_offerings_course_university_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semester_offerings
    ADD CONSTRAINT semester_offerings_course_university_id_fkey FOREIGN KEY (course_university_id) REFERENCES public.course_universities(id) ON DELETE CASCADE;


--
-- Name: semester_offerings semester_offerings_program_semester_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.semester_offerings
    ADD CONSTRAINT semester_offerings_program_semester_id_fkey FOREIGN KEY (program_semester_id) REFERENCES public.program_semesters(id) ON DELETE CASCADE;


--
-- Name: task_responsibles task_responsibles_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_responsibles
    ADD CONSTRAINT task_responsibles_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: task_responsibles task_responsibles_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.task_responsibles
    ADD CONSTRAINT task_responsibles_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.project_tasks(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
