"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataBase = void 0;
const projects_1 = require("./models/projects");
const skills_1 = require("./models/skills");
const projectTaskResponsible_1 = require("./models/projectTaskResponsible");
const memberSkills_1 = require("./models/memberSkills");
const member_1 = require("./models/member");
const goal_1 = require("./models/goal");
const projectTask_1 = require("./models/projectTask");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
const token_1 = require("./models/token");
const role_1 = require("./models/role");
const permission_1 = require("./models/permission");
const state_1 = require("./models/state");
const city_1 = require("./models/city");
const university_1 = require("./models/university");
const course_1 = require("./models/course");
const car_1 = require("./models/car");
const courseUniversity_1 = require("./models/courseUniversity");
const memberCourse_1 = require("./models/memberCourse");
const cae_1 = require("./models/cae");
const caeManager_1 = require("./models/caeManager");
const courseManager_1 = require("./models/courseManager");
const miscellaneous_1 = require("./models/miscellaneous");
const miscellaneousOwner_1 = require("./models/miscellaneousOwner");
const miscellaneousParticipant_1 = require("./models/miscellaneousParticipant");
const miscellaneousWaitlist_1 = require("./models/miscellaneousWaitlist");
const miscellaneousRequest_1 = require("./models/miscellaneousRequest");
const miscellaneousInvite_1 = require("./models/miscellaneousInvite");
const miscellaneousApprovalLog_1 = require("./models/miscellaneousApprovalLog");
const attendance_1 = require("./models/attendance");
const form_1 = require("./models/form");
const externalProfile_1 = require("./models/externalProfile");
// ─── Multi-tenant models ───────────────────────────────────────────────────
const plan_1 = require("./models/plan");
const organization_1 = require("./models/organization");
const organizationFeature_1 = require("./models/organizationFeature");
const orgUnitType_1 = require("./models/orgUnitType");
const orgUnit_1 = require("./models/orgUnit");
const position_1 = require("./models/position");
const mandate_1 = require("./models/mandate");
const auditLog_1 = require("./models/auditLog");
const memberCustomField_1 = require("./models/memberCustomField");
const registrationDraft_1 = require("./models/registrationDraft");
const externalAccountProfile_1 = require("./models/externalAccountProfile");
const externalEventRegistration_1 = require("./models/externalEventRegistration");
const globalUserAccount_1 = require("./models/globalUserAccount");
const mediaAsset_1 = require("./models/mediaAsset");
const orgHomeConfig_1 = require("./models/orgHomeConfig");
const orgHomeSection_1 = require("./models/orgHomeSection");
const dotenv = __importStar(require("dotenv"));
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
    type: 'postgres',
    entities: [
        member_1.Member,
        memberSkills_1.MemberSkill,
        memberCourse_1.MemberCourse,
        skills_1.Skill,
        goal_1.Goal,
        projectTask_1.ProjectTask,
        projectTaskResponsible_1.ProjectTaskResponsible,
        projects_1.Project,
        token_1.Token,
        role_1.Role,
        permission_1.Permission,
        state_1.State,
        city_1.City,
        university_1.University,
        course_1.Course,
        courseUniversity_1.CourseUniversity,
        car_1.Car,
        cae_1.Cae,
        caeManager_1.CaeManager,
        courseManager_1.CourseManager,
        miscellaneous_1.Miscellaneous,
        miscellaneousOwner_1.MiscellaneousOwner,
        miscellaneousParticipant_1.MiscellaneousParticipant,
        miscellaneousWaitlist_1.MiscellaneousWaitlist,
        miscellaneousRequest_1.MiscellaneousRequest,
        miscellaneousInvite_1.MiscellaneousInvite,
        miscellaneousApprovalLog_1.MiscellaneousApprovalLog,
        attendance_1.AttendanceSession,
        attendance_1.AttendanceRecord,
        attendance_1.AttendanceToken,
        form_1.Form,
        form_1.FormQuestion,
        form_1.FormOption,
        form_1.FormResponse,
        form_1.FormAnswer,
        externalProfile_1.ExternalProfile,
        // ─── Multi-tenant ────────────────────────────────────────────────────
        plan_1.Plan,
        organization_1.Organization,
        organizationFeature_1.OrganizationFeature,
        orgUnitType_1.OrgUnitType,
        orgUnit_1.OrgUnit,
        position_1.Position,
        mandate_1.Mandate,
        auditLog_1.AuditLog,
        memberCustomField_1.MemberCustomFieldDefinition,
        memberCustomField_1.MemberCustomFieldValue,
        registrationDraft_1.RegistrationDraft,
        externalAccountProfile_1.ExternalAccountProfile,
        externalEventRegistration_1.ExternalEventRegistration,
        globalUserAccount_1.UserAccount,
        mediaAsset_1.MediaAsset,
        orgHomeConfig_1.OrgHomeConfig,
        orgHomeSection_1.OrgHomeSection,
    ],
    migrations: [(0, path_1.join)(__dirname, 'migrations', '*.{js,ts}')],
    migrationsTableName: 'migrations',
};
const dataSourceOptions = databaseUrl
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
exports.AppDataBase = new typeorm_1.DataSource(dataSourceOptions);
