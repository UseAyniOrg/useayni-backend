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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const MemberRepository_1 = require("../repositories/MemberRepository");
const TokenRepository_1 = require("../repositories/TokenRepository");
const RoleRepository_1 = require("../repositories/RoleRepository");
const CourseManagerRepository_1 = require("../repositories/CourseManagerRepository");
const CaeManagerRepository_1 = require("../repositories/CaeManagerRepository");
const StateRepository_1 = require("../repositories/StateRepository");
const CityRepository_1 = require("../repositories/CityRepository");
const UniversityRepository_1 = require("../repositories/UniversityRepository");
const CourseRepository_1 = require("../repositories/CourseRepository");
const CourseUniversityRepository_1 = require("../repositories/CourseUniversityRepository");
const member_1 = require("../models/member");
const db_1 = require("../db");
let MemberService = class MemberService {
    constructor(memberRepository, tokenRepository, stateRepository, cityRepository, universityRepository, courseRepository, courseUniversityRepository, roleRepository) {
        this.memberRepository = memberRepository;
        this.tokenRepository = tokenRepository;
        this.stateRepository = stateRepository;
        this.cityRepository = cityRepository;
        this.universityRepository = universityRepository;
        this.courseRepository = courseRepository;
        this.courseUniversityRepository = courseUniversityRepository;
        this.roleRepository = roleRepository;
    }
    async getMembersForApproval(reviewerId) {
        const reviewer = await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);
        if (!reviewer)
            throw new Error('Reviewer not found');
        const pendingMembers = await this.memberRepository.findByRegistrationStatus(member_1.MemberRegistrationStatus.PENDING);
        const result = [];
        for (const member of pendingMembers) {
            const canAccess = await this.canReviewerAccessMember(reviewerId, member);
            if (canAccess) {
                result.push(member);
            }
        }
        return result;
    }
    async getAllMembers() {
        return this.memberRepository.findAll();
    }
    async getSponsorOptions() {
        const members = await this.memberRepository.findSponsorOptions();
        return members.map(member => {
            const activeCourse = member.memberCourses?.find(mc => mc.status === 'active') || member.memberCourses?.[0];
            const courseUniversity = activeCourse?.courseUniversity;
            return {
                id: member.id,
                name: member.name,
                slug: member.slug,
                profile_picture_url: member.profile_picture_url,
                course: courseUniversity?.course
                    ? {
                        id: courseUniversity.course.id,
                        name: courseUniversity.course.name,
                    }
                    : undefined,
                university: courseUniversity?.university
                    ? {
                        id: courseUniversity.university.id,
                        name: courseUniversity.university.name,
                    }
                    : undefined,
            };
        });
    }
    async searchMembers(query, limit) {
        const members = await this.memberRepository.search(query, limit);
        return {
            data: members.map(m => ({
                id: m.id,
                name: m.name,
                email: m.email_personal,
                avatar_url: m.profile_picture_url,
            })),
        };
    }
    async getMemberById(id) {
        const member = await this.memberRepository.findByIdWithRelations(id);
        if (!member)
            throw new Error('Member not found');
        return member;
    }
    async getMemberByEmail(email) {
        const member = await this.memberRepository.findByEmail(email);
        if (!member)
            throw new Error('Member not found');
        return member;
    }
    async getMembersBySponsor(sponsorId) {
        const members = await this.memberRepository.findBySponsor(sponsorId);
        if (members.length === 0)
            throw new Error('No members found with this sponsor');
        return members;
    }
    async getPendingMembers() {
        return this.memberRepository.findByRegistrationStatus(member_1.MemberRegistrationStatus.PENDING);
    }
    async getPendingMembersForReviewer(reviewerId) {
        const reviewer = await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);
        if (!reviewer)
            throw new Error('Reviewer not found');
        const pending = await this.memberRepository.findByRegistrationStatus(member_1.MemberRegistrationStatus.PENDING);
        // equipe técnica vê tudo
        if (reviewer.roles?.some(r => r.name === 'EQUIPE_TECNICA')) {
            return pending;
        }
        const filtered = [];
        for (const member of pending) {
            const canAccess = await this.canReviewerAccessMember(reviewerId, member);
            if (canAccess) {
                filtered.push(member);
            }
        }
        return filtered;
    }
    async getMemberBySlug(slug) {
        const member = await this.memberRepository.findByNameSlug(slug);
        if (!member)
            throw new Error('Member not found');
        let sponsor = null;
        if (member.sponsor) {
            const sponsorMember = await this.memberRepository.findById(member.sponsor);
            sponsor = sponsorMember
                ? {
                    id: sponsorMember.id,
                    name: sponsorMember.name,
                    profile_picture_url: sponsorMember.profile_picture_url,
                }
                : null;
        }
        let courseData;
        let universityData;
        if (member.memberCourses && member.memberCourses.length > 0) {
            const active = member.memberCourses.find(mc => mc.status === 'active');
            const chosen = active || member.memberCourses[0];
            if (chosen && chosen.courseUniversity) {
                const cu = chosen.courseUniversity;
                courseData = cu.course ? { id: cu.course.id, name: cu.course.name } : undefined;
                universityData = cu.university
                    ? { id: cu.university.id, name: cu.university.name }
                    : undefined;
            }
        }
        const profileDto = {
            id: member.id,
            name: member.name,
            phone: member.phone,
            ra: member.ra,
            profile_picture_url: member.profile_picture_url,
            birth_date: member.birth_date,
            admission_date: member.admission_date,
            biography: member.biography,
            banner_url: member.banner_url,
            curriculum_url: member.curriculum_url,
            youtube_url: member.youtube_url,
            twitter_url: member.twitter_url,
            instagram_url: member.instagram_url,
            linkedin_url: member.linkedin_url,
            github_url: member.github_url,
            course: courseData,
            city: member.city
                ? {
                    id: member.city.id,
                    name: member.city.name,
                }
                : undefined,
            university: universityData,
            sponsor: sponsor || undefined,
            roles: member.roles?.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
            })) || undefined,
        };
        return profileDto;
    }
    async createMember(memberData, password, defaultSponsorMemberId) {
        if (memberData.confirm_password && memberData.confirm_password !== password) {
            throw new Error('Senha e confirmaÃ§Ã£o de senha nÃ£o conferem');
        }
        const academicData = await this.resolveAcademicData(memberData);
        const name = this.resolveMemberName(memberData);
        const birth_date = this.resolveDateOnly(memberData.birth_date);
        const admission_date = this.resolveDateOnly(memberData.admission_date);
        const normalizedData = {
            name,
            cpf: memberData.cpf.replace(/\D/g, ''),
            phone: memberData.phone,
            email_personal: memberData.email_personal,
            email_university: memberData.email_university,
            birth_date,
            admission_date,
            ra: String(memberData.ra),
            city_id: academicData.cityId || memberData.city_id || null,
            current_semester: memberData.current_semester || null,
            university_not_applicable: !!memberData.university_not_applicable,
            course_not_applicable: !!memberData.course_not_applicable,
            current_semester_not_applicable: !!memberData.current_semester_not_applicable,
            registration_status: member_1.MemberRegistrationStatus.PENDING,
            biography: memberData.biography || undefined,
        };
        if (!this.isValidCpf(normalizedData.cpf)) {
            throw new Error('CPF invalido');
        }
        const existing = await this.memberRepository.existsByEmailOrCpfOrRa(normalizedData.email_personal, normalizedData.email_university, normalizedData.cpf, normalizedData.ra);
        if (existing)
            throw new Error('CPF, RA ou email já cadastrados');
        const sponsorId = await this.resolveSponsorId(memberData.sponsor, defaultSponsorMemberId);
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newMember = await this.memberRepository.create({
            ...normalizedData,
            password: hashedPassword,
            sponsor: sponsorId,
        });
        if (academicData.courseUniversityId) {
            await this.memberRepository.addCourseToMember(newMember.id, academicData.courseUniversityId, normalizedData.admission_date);
        }
        const { password: _, ...safeMemberData } = newMember;
        // Gerar token de acesso automaticamente após signup
        const AuthService = (await Promise.resolve().then(() => __importStar(require('./authService')))).AuthService;
        const authService = new AuthService(this.memberRepository, this.tokenRepository);
        const accessToken = await authService['generateAccessToken'](newMember.id);
        return { member: safeMemberData, accessToken };
    }
    async resolveSponsorId(sponsor, defaultSponsorMemberId) {
        const sponsorValue = sponsor?.trim();
        const defaultSponsorValue = defaultSponsorMemberId?.trim();
        if (defaultSponsorValue && !this.isUuid(defaultSponsorValue)) {
            throw new Error('memberId deve ser um UUID valido');
        }
        const selectedSponsor = sponsorValue || defaultSponsorValue;
        if (!selectedSponsor)
            return null;
        if (this.isUuid(selectedSponsor)) {
            const sponsorMember = await this.memberRepository.findById(selectedSponsor);
            if (!sponsorMember) {
                throw new Error('Padrinho informado nao encontrado');
            }
            return sponsorMember.id;
        }
        const sponsorMember = await this.memberRepository.findByName(selectedSponsor);
        return sponsorMember?.id || null;
    }
    isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
    resolveDateOnly(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error('Data de ingresso invalida');
        }
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    resolveMemberName(memberData) {
        const name = memberData.name?.trim();
        if (name)
            return name;
        const composedName = [memberData.first_name, memberData.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();
        if (!composedName)
            throw new Error('Nome do membro Ã© obrigatÃ³rio');
        return composedName;
    }
    isValidCpf(cpf) {
        const digits = cpf.replace(/\D/g, '');
        if (digits.length !== 11)
            return false;
        if (/^(\d)\1{10}$/.test(digits))
            return false;
        const calculateDigit = (base, factor) => {
            const total = base.split('').reduce((sum, digit) => sum + Number(digit) * factor--, 0);
            const remainder = (total * 10) % 11;
            return remainder === 10 ? 0 : remainder;
        };
        const firstDigit = calculateDigit(digits.slice(0, 9), 10);
        const secondDigit = calculateDigit(digits.slice(0, 10), 11);
        return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
    }
    async resolveAcademicData(memberData) {
        let cityId = memberData.city_id;
        if (!cityId && memberData.city_ibge_code && memberData.city_name) {
            if (!memberData.state_id && !memberData.state_uf) {
                throw new Error('Estado Ã© obrigatÃ³rio para cadastrar cidade pelo IBGE');
            }
            const state = memberData.state_id
                ? await this.stateRepository.findById(memberData.state_id)
                : await this.stateRepository.findOrCreateByUf(memberData.state_uf);
            if (!state)
                throw new Error('Estado nÃ£o encontrado');
            const city = await this.cityRepository.findOrCreateFromIbge({
                name: memberData.city_name,
                ibge_code: memberData.city_ibge_code.replace(/\D/g, ''),
                state_id: state.id,
            });
            cityId = city?.id;
        }
        if (memberData.course_university_id) {
            return { cityId, courseUniversityId: memberData.course_university_id };
        }
        if (memberData.university_not_applicable || memberData.course_not_applicable || !cityId) {
            return { cityId };
        }
        if (!memberData.university_id &&
            !memberData.university_name &&
            !memberData.university_emec_code) {
            return { cityId };
        }
        const universityId = memberData.university_id ||
            (await this.universityRepository.findOrCreateByNormalizedName({
                name: memberData.university_name || memberData.university_emec_code,
                acronym: memberData.university_acronym || null,
                emec_code: memberData.university_emec_code || null,
                city_id: cityId,
                source: memberData.university_emec_code ? 'MEC_EMEC_CSV' : 'USER_SIGNUP',
            }))?.id;
        if (!universityId || (!memberData.course_name && !memberData.course_id)) {
            return { cityId };
        }
        const courseId = memberData.course_id ||
            (await this.courseRepository.findOrCreateByName(memberData.course_name)).id;
        const courseUniversity = await this.courseUniversityRepository.findOrCreate({
            course_id: courseId,
            university_id: universityId,
            city_id: cityId,
        });
        return { cityId, courseUniversityId: courseUniversity.id };
    }
    async updateMember(id, updateData) {
        const existingMember = await this.memberRepository.findById(id);
        if (!existingMember)
            throw new Error('Member not found');
        if (updateData.course_university_id) {
            await this.memberRepository.addCourseToMember(id, updateData.course_university_id);
            delete updateData.course_university_id;
        }
        return this.memberRepository.update(id, updateData);
    }
    async approveMemberRegistration(memberId, reviewerId) {
        await this.ensureCanReviewRegistration(memberId, reviewerId);
        const updated = await this.memberRepository.updateRegistrationStatus(memberId, member_1.MemberRegistrationStatus.APPROVED, reviewerId);
        return {
            message: 'Member approved successfully',
            member: updated,
        };
    }
    async rejectMemberRegistration(memberId, reviewerId, reason) {
        await this.ensureCanReviewRegistration(memberId, reviewerId);
        const member = await this.memberRepository.findById(memberId);
        if (!member)
            throw new Error('Member not found');
        await this.memberRepository.delete(memberId);
        return {
            message: 'Member rejected and deleted successfully',
            memberId,
        };
    }
    async ensureCanReviewRegistration(memberId, reviewerId) {
        const reviewer = await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);
        if (!reviewer)
            throw new Error('Reviewer not found');
        if (reviewer.roles?.some(role => role.name === 'EQUIPE_TECNICA')) {
            return;
        }
        const target = await this.memberRepository.findByIdWithRelations(memberId);
        if (!target)
            throw new Error('Member not found');
        const activeCourse = target.memberCourses?.find(memberCourse => memberCourse.status === 'active');
        const courseUniversity = activeCourse?.courseUniversity;
        const cityId = target.city_id || courseUniversity?.city_id;
        const stateId = target.city?.state?.id || courseUniversity?.city?.state?.id;
        const courseId = courseUniversity?.course_id;
        const checks = await Promise.all([
            courseUniversity
                ? this.isCourseManagerReviewer(reviewerId, courseUniversity.id)
                : Promise.resolve(false),
            courseId && target.current_semester
                ? this.isSemesterHeadReviewer(reviewerId, courseId, target.current_semester)
                : Promise.resolve(false),
            cityId ? this.isCarReviewer(reviewerId, cityId) : Promise.resolve(false),
            stateId ? this.isCaeReviewer(reviewerId, stateId) : Promise.resolve(false),
        ]);
        if (!checks.some(Boolean)) {
            throw new common_1.ForbiddenException('VocÃª nÃ£o tem permissÃ£o para validar este cadastro');
        }
    }
    async isCourseManagerReviewer(reviewerId, courseUniversityId) {
        const result = await db_1.AppDataBase.query(`SELECT 1
       FROM course_managers
       WHERE member_id = $1
         AND course_university_id = $2
         AND end_date IS NULL
         AND deleted_at IS NULL
       LIMIT 1`, [reviewerId, courseUniversityId]);
        return result.length > 0;
    }
    async isSemesterHeadReviewer(reviewerId, courseId, currentSemester) {
        const result = await db_1.AppDataBase.query(`SELECT 1
       FROM program_semester_heads psh
       JOIN program_semesters ps ON ps.id = psh.program_semester_id
       WHERE psh.member_id = $1
         AND ps.course_id = $2
         AND ps.semester_number = $3
         AND psh.end_date IS NULL
         AND psh.deleted_at IS NULL
       LIMIT 1`, [reviewerId, courseId, currentSemester]);
        return result.length > 0;
    }
    async isCarReviewer(reviewerId, cityId) {
        const result = await db_1.AppDataBase.query(`SELECT 1
       FROM car_managers cm
       JOIN car_cities cc ON cc.car_id = cm.car_id
       WHERE cm.member_id = $1
         AND cc.city_id = $2
       LIMIT 1`, [reviewerId, cityId]);
        return result.length > 0;
    }
    async isCaeReviewer(reviewerId, stateId) {
        const result = await db_1.AppDataBase.query(`SELECT 1
       FROM cae_managers cm
       JOIN caes c ON c.id = cm.cae_id
       WHERE cm.member_id = $1
         AND c.state_id = $2
         AND cm.end_date IS NULL
         AND cm.deleted_at IS NULL
       LIMIT 1`, [reviewerId, stateId]);
        return result.length > 0;
    }
    async getMemberRolesAndPermissions(id) {
        const member = await this.memberRepository.findByIdWithRolesAndPermissions(id);
        if (!member)
            throw new Error('Member not found');
        return {
            memberId: member.id,
            memberName: member.name,
            roles: member.roles?.map(role => ({
                id: role.id,
                name: role.name,
                description: role.description,
                permissions: role.permissions?.map(perm => ({
                    id: perm.id,
                    name: perm.name,
                    description: perm.description,
                })) || [],
            })) || [],
        };
    }
    // Gerenciamento de Roles
    async addRoleToMember(memberId, roleName) {
        const role = await this.roleRepository.findByName(roleName);
        if (!role)
            throw new Error(`Role ${roleName} não encontrada`);
        await db_1.AppDataBase.query('INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [memberId, role.id]);
        // Invalidar tokens do usuário
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async removeRoleFromMember(memberId, roleName) {
        const role = await this.roleRepository.findByName(roleName);
        if (!role)
            throw new Error(`Role ${roleName} não encontrada`);
        await db_1.AppDataBase.query('DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2', [
            memberId,
            role.id,
        ]);
        // Invalidar tokens do usuário
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    // Gerenciamento de Posições - DIRIGENTE
    async addDirigentePosition(memberId, courseUniversityId, startDate) {
        const manager = CourseManagerRepository_1.CourseManagerRepository.create({
            member_id: memberId,
            course_university_id: courseUniversityId,
            start_date: startDate || new Date(),
        });
        await CourseManagerRepository_1.CourseManagerRepository.save(manager);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async removeDirigentePosition(memberId, courseUniversityId) {
        const manager = await CourseManagerRepository_1.CourseManagerRepository.findOne({
            where: { member_id: memberId, course_university_id: courseUniversityId, end_date: (0, typeorm_1.IsNull)() },
        });
        if (manager) {
            manager.end_date = new Date();
            await CourseManagerRepository_1.CourseManagerRepository.save(manager);
            await this.tokenRepository.deleteByMemberId(memberId);
        }
    }
    // Gerenciamento de Posições - CAR
    async addCarPosition(memberId, carId) {
        await db_1.AppDataBase.query('INSERT INTO car_managers (car_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [carId, memberId]);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async removeCarPosition(memberId, carId) {
        await db_1.AppDataBase.query('DELETE FROM car_managers WHERE car_id = $1 AND member_id = $2', [
            carId,
            memberId,
        ]);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    // Gerenciamento de Posições - CAE
    async addCaePosition(memberId, caeId, startDate) {
        const manager = CaeManagerRepository_1.CaeManagerRepository.create({
            member_id: memberId,
            cae_id: caeId,
            start_date: startDate || new Date(),
        });
        await CaeManagerRepository_1.CaeManagerRepository.save(manager);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async removeCaePosition(memberId, caeId) {
        const manager = await CaeManagerRepository_1.CaeManagerRepository.findOne({
            where: { member_id: memberId, cae_id: caeId, end_date: (0, typeorm_1.IsNull)() },
        });
        if (manager) {
            manager.end_date = new Date();
            await CaeManagerRepository_1.CaeManagerRepository.save(manager);
            await this.tokenRepository.deleteByMemberId(memberId);
        }
    }
    // Gerenciamento de Posições - REPRESENTANTE
    async addRepresentantePosition(memberId, programSemesterId, startDate) {
        await db_1.AppDataBase.query('INSERT INTO program_semester_heads (program_semester_id, member_id, start_date) VALUES ($1, $2, $3)', [programSemesterId, memberId, startDate || new Date()]);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async removeRepresentantePosition(memberId, programSemesterId) {
        await db_1.AppDataBase.query('UPDATE program_semester_heads SET end_date = NOW() WHERE program_semester_id = $1 AND member_id = $2 AND end_date IS NULL', [programSemesterId, memberId]);
        await this.tokenRepository.deleteByMemberId(memberId);
    }
    async canReviewerAccessMember(reviewerId, member) {
        const activeCourse = member.memberCourses?.find(mc => mc.status === 'active');
        const courseUniversity = activeCourse?.courseUniversity;
        const cityId = member.city_id || courseUniversity?.city_id;
        const stateId = member.city?.state?.id || courseUniversity?.city?.state?.id;
        const courseId = courseUniversity?.course_id;
        const checks = await Promise.all([
            courseUniversity ? this.isCourseManagerReviewer(reviewerId, courseUniversity.id) : false,
            courseId && member.current_semester
                ? this.isSemesterHeadReviewer(reviewerId, courseId, member.current_semester)
                : false,
            cityId ? this.isCarReviewer(reviewerId, cityId) : false,
            stateId ? this.isCaeReviewer(reviewerId, stateId) : false,
        ]);
        return checks.some(Boolean);
    }
};
exports.MemberService = MemberService;
exports.MemberService = MemberService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MemberRepository_1.MemberRepository,
        TokenRepository_1.TokenRepository,
        StateRepository_1.StateRepository,
        CityRepository_1.CityRepository,
        UniversityRepository_1.UniversityRepository,
        CourseRepository_1.CourseRepository,
        CourseUniversityRepository_1.CourseUniversityRepository,
        RoleRepository_1.RoleRepository])
], MemberService);
