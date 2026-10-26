import { Project } from './models/projects';
import { Skill } from './models/skills';
import { ProjectTaskResponsible } from './models/projectTaskResponsible';
import { MemberSkill } from './models/memberSkills';
import { Member } from './models/member';
import { Goal } from './models/goal';
import { ProjectTask } from './models/projectTask';
import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';
import { Token } from './models/token';
import { Role } from './models/role';
import { Permission } from './models/permission';
import { State } from './models/state';
import { City } from './models/city';
import { University } from './models/university';
import { Course } from './models/course';
import { Car } from './models/car';
import { CourseUniversity } from './models/courseUniversity';
import { MemberCourse } from './models/memberCourse';
import { Cae } from './models/cae';
import { CaeManager } from './models/caeManager';
import { CourseManager } from './models/courseManager';
import { Miscellaneous } from './models/miscellaneous';
import { MiscellaneousOwner } from './models/miscellaneousOwner';
import { MiscellaneousParticipant } from './models/miscellaneousParticipant';
import { MiscellaneousWaitlist } from './models/miscellaneousWaitlist';
import { MiscellaneousRequest } from './models/miscellaneousRequest';
import { MiscellaneousInvite } from './models/miscellaneousInvite';
import { MiscellaneousApprovalLog } from './models/miscellaneousApprovalLog';
import { AttendanceSession, AttendanceRecord, AttendanceToken } from './models/attendance';
import { Form, FormQuestion, FormOption, FormResponse, FormAnswer } from './models/form';
import { ExternalProfile } from './models/externalProfile';
// ─── Multi-tenant models ───────────────────────────────────────────────────
import { Plan } from './models/plan';
import { Organization } from './models/organization';
import { OrganizationFeature } from './models/organizationFeature';
import { OrgUnitType } from './models/orgUnitType';
import { OrgUnit } from './models/orgUnit';
import { Position } from './models/position';
import { Mandate } from './models/mandate';
import { AuditLog } from './models/auditLog';
import { MemberCustomFieldDefinition, MemberCustomFieldValue } from './models/memberCustomField';
import { RegistrationDraft } from './models/registrationDraft';
import { ExternalAccountProfile } from './models/externalAccountProfile';
import { ExternalEventRegistration } from './models/externalEventRegistration';
import { UserAccount } from './models/globalUserAccount';
import { MediaAsset } from './models/mediaAsset';
import { OrgHomeConfig } from './models/orgHomeConfig';
import { OrgHomeSection } from './models/orgHomeSection';
import * as dotenv from 'dotenv';

dotenv.config();

const env = process.env;
const databaseUrl = env.DATABASE_URL || env.DB_URL;
const host = env.PGHOST || env.DB_HOST;
const port = Number(env.PGPORT || env.DB_PORT || 5432);
const username = env.PGUSER || env.DB_USERNAME;
const password = env.PGPASSWORD || env.DB_PASSWORD;
const database = env.PGDATABASE || env.DB_DATABASE;
const sslMode = env.PGSSLMODE || env.DB_SSL_MODE;

const baseConfig = {
  type: 'postgres' as const,
  entities: [
    Member,
    MemberSkill,
    MemberCourse,
    Skill,
    Goal,
    ProjectTask,
    ProjectTaskResponsible,
    Project,
    Token,
    Role,
    Permission,
    State,
    City,
    University,
    Course,
    CourseUniversity,
    Car,
    Cae,
    CaeManager,
    CourseManager,
    Miscellaneous,
    MiscellaneousOwner,
    MiscellaneousParticipant,
    MiscellaneousWaitlist,
    MiscellaneousRequest,
    MiscellaneousInvite,
    MiscellaneousApprovalLog,
    AttendanceSession,
    AttendanceRecord,
    AttendanceToken,
    Form,
    FormQuestion,
    FormOption,
    FormResponse,
    FormAnswer,
    ExternalProfile,
    // ─── Multi-tenant ────────────────────────────────────────────────────
    Plan,
    Organization,
    OrganizationFeature,
    OrgUnitType,
    OrgUnit,
    Position,
    Mandate,
    AuditLog,
    MemberCustomFieldDefinition,
    MemberCustomFieldValue,
    RegistrationDraft,
    ExternalAccountProfile,
    ExternalEventRegistration,
    UserAccount,
    MediaAsset,
    OrgHomeConfig,
    OrgHomeSection,
  ],
  migrations: [join(__dirname, 'migrations', '*.{js,ts}')],
  migrationsTableName: 'migrations',
};

const dataSourceOptions: DataSourceOptions = databaseUrl
  ? {
      ...baseConfig,
      url: databaseUrl,
      ssl: sslMode ? { rejectUnauthorized: false } : undefined,
    }
  : {
      ...baseConfig,
      host,
      port,
      username,
      password,
      database,
      ssl: sslMode ? { rejectUnauthorized: false } : undefined,
    };

export const AppDataBase = new DataSource(dataSourceOptions);
