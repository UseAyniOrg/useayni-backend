import { Project } from './models/projects';
import { Skill } from './models/skills';
import { ProjectTaskResponsible } from './models/projectTaskResponsible'
import { MemberSkill } from './models/memberSkills';
import { Member } from './models/member';
import { Goal } from './models/goal';
import { ProjectTask } from './models/projectTask';
import { DataSource } from "typeorm";
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

export const AppDataBase = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
    CourseManager
  ],
  migrations: ["src/migrations/*.ts"],
  migrationsTableName: "migrations",
});