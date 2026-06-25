"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const member_1 = require("../models/member");
let MemberRepository = class MemberRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(member_1.Member);
    }
    async findAll() {
        return this.repository.find();
    }
    async findSponsorOptions() {
        return this.repository.find({
            relations: [
                "memberCourses",
                "memberCourses.courseUniversity",
                "memberCourses.courseUniversity.course",
                "memberCourses.courseUniversity.university",
            ],
            order: { name: "ASC" },
        });
    }
    async findByRegistrationStatus(status) {
        return this.repository.find({
            where: { registration_status: status },
            relations: [
                "city",
                "city.state",
                "roles",
                "memberCourses",
                "memberCourses.courseUniversity",
                "memberCourses.courseUniversity.course",
                "memberCourses.courseUniversity.university",
                "memberCourses.courseUniversity.city",
            ],
            order: { admission_date: "DESC" },
        });
    }
    async findById(id) {
        return this.repository.findOneBy({ id });
    }
    async findByEmail(email) {
        return this.repository.findOneBy({ email_personal: email });
    }
    async findByEmailWithPassword(email) {
        return this.repository
            .createQueryBuilder('member')
            .addSelect('member.password')
            .leftJoinAndSelect('member.roles', 'roles')
            .where('member.email_personal = :email', { email })
            .getOne();
    }
    async findBySponsor(sponsorId) {
        return this.repository.findBy({ sponsor: sponsorId });
    }
    async findByName(name) {
        return this.repository.findOne({ where: { name } });
    }
    async existsByEmailOrCpfOrRa(email_personal, email_university, cpf, ra) {
        return this.repository.findOne({
            where: [
                { email_personal },
                { email_university },
                { cpf },
                { ra },
            ],
        });
    }
    async create(memberData) {
        const member = this.repository.create(memberData);
        return this.repository.save(member);
    }
    async update(id, updateData) {
        await this.repository.update(id, updateData);
        return this.findById(id);
    }
    async delete(id) {
        await this.repository.delete(id);
    }
    async updateRegistrationStatus(id, status, reviewerId, rejectionReason) {
        await this.repository.update(id, {
            registration_status: status,
            registration_reviewed_by: reviewerId,
            registration_reviewed_at: new Date(),
            registration_rejection_reason: status === member_1.MemberRegistrationStatus.REJECTED
                ? rejectionReason || null
                : null,
        });
        return this.findByIdWithRelations(id);
    }
    async findByIdWithRolesAndPermissions(id) {
        return this.repository.findOne({
            where: { id },
            relations: ["roles", "roles.permissions"],
        });
    }
    async findByIdWithRelations(id) {
        return this.repository.findOne({
            where: { id },
            relations: [
                "city",
                "roles",
                "memberCourses",
                "memberCourses.courseUniversity",
                "memberCourses.courseUniversity.course",
                "memberCourses.courseUniversity.university",
                "memberCourses.courseUniversity.city",
                "memberCourses.courseUniversity.city.state",
            ],
        });
    }
    async findByIdWithPositions(id) {
        const member = await this.repository.findOne({
            where: { id },
            relations: [
                "roles",
                "memberCourses",
                "memberCourses.courseUniversity",
                "memberCourses.courseUniversity.course",
                "memberCourses.courseUniversity.university",
                "memberCourses.courseUniversity.city",
            ],
        });
        if (!member)
            return null;
        // Buscar posições do membro
        const [courseManagers, carManagers, caeManagers, semesterHeads] = await Promise.all([
            this.repository.manager.query(`SELECT cm.*, cu.id as course_university_id, c.name as course_name, u.name as university_name, ci.name as city_name
         FROM course_managers cm
         JOIN course_universities cu ON cm.course_university_id = cu.id
         JOIN courses c ON cu.course_id = c.id
         JOIN universities u ON cu.university_id = u.id
         JOIN cities ci ON cu.city_id = ci.id
         WHERE cm.member_id = $1 AND cm.end_date IS NULL AND cm.deleted_at IS NULL`, [id]),
            this.repository.manager.query(`SELECT cm.*, ca.id as car_id, ca.name as car_name
         FROM car_managers cm
         JOIN cars ca ON cm.car_id = ca.id
         WHERE cm.member_id = $1`, [id]),
            this.repository.manager.query(`SELECT cm.*, cae.id as cae_id, cae.name as cae_name, s.name as state_name
         FROM cae_managers cm
         JOIN caes cae ON cm.cae_id = cae.id
         JOIN states s ON cae.state_id = s.id
         WHERE cm.member_id = $1 AND cm.end_date IS NULL AND cm.deleted_at IS NULL`, [id]),
            this.repository.manager.query(`SELECT psh.*, ps.semester_number, c.name as course_name
         FROM program_semester_heads psh
         JOIN program_semesters ps ON psh.program_semester_id = ps.id
         JOIN courses c ON ps.course_id = c.id
         WHERE psh.member_id = $1 AND psh.end_date IS NULL AND psh.deleted_at IS NULL`, [id]),
        ]);
        return {
            ...member,
            positions: {
                courseManagers,
                carManagers,
                caeManagers,
                semesterHeads,
            },
        };
    }
    async addCourseToMember(memberId, courseUniversityId, startedAt) {
        const dateStr = (startedAt || new Date()).toISOString().split("T")[0];
        await this.repository.manager.query(`INSERT INTO member_courses (member_id, course_university_id, status, started_at)
       VALUES ($1, $2, 'active', $3)
       ON CONFLICT (member_id, course_university_id) DO NOTHING`, [memberId, courseUniversityId, dateStr]);
    }
    async search(query, limit) {
        return this.repository
            .createQueryBuilder('m')
            .select(['m.id', 'm.name', 'm.email_personal', 'm.profile_picture_url'])
            .where('m.name ILIKE :q OR m.email_personal ILIKE :q', { q: `%${query}%` })
            .orderBy('m.name', 'ASC')
            .limit(limit)
            .getMany();
    }
    async findByNameSlug(slug) {
        return this.repository.findOne({
            where: { slug: slug },
            relations: [
                "city",
                "roles",
                "memberCourses",
                "memberCourses.courseUniversity",
                "memberCourses.courseUniversity.course",
                "memberCourses.courseUniversity.university",
            ],
        });
    }
};
exports.MemberRepository = MemberRepository;
exports.MemberRepository = MemberRepository = __decorate([
    (0, common_1.Injectable)()
], MemberRepository);
