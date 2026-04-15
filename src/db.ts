import { Project } from './models/projects';
import { Skill } from './models/skills';
import { ProjectTaskResponsible } from './models/projectTaskResponsible';
import { MemberSkill } from './models/memberSkills';
import { Member } from './models/member';
import { Goal } from './models/goal';
import { ProjectTask } from './models/projectTask';
import { DataSource, DataSourceOptions } from 'typeorm';
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
  ],
  migrations: ['src/migrations/*.ts'],
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
