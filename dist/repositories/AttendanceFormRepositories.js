"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormRepository = exports.AttendanceRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const attendance_1 = require("../models/attendance");
const form_1 = require("../models/form");
let AttendanceRepository = class AttendanceRepository {
    constructor() {
        this.sessionRepo = db_1.AppDataBase.getRepository(attendance_1.AttendanceSession);
        this.recordRepo = db_1.AppDataBase.getRepository(attendance_1.AttendanceRecord);
        this.tokenRepo = db_1.AppDataBase.getRepository(attendance_1.AttendanceToken);
    }
    async createSession(data) {
        const entity = this.sessionRepo.create(data);
        return this.sessionRepo.save(entity);
    }
    async findSessionById(id) {
        return this.sessionRepo.findOne({ where: { id }, relations: ['miscellaneous'] });
    }
    async findSessionsByMiscellaneous(miscellaneousId) {
        return this.sessionRepo.find({
            where: { miscellaneous_id: miscellaneousId },
            order: { created_at: 'DESC' },
        });
    }
    async createOrUpdateRecord(sessionId, memberId, present, checkedInAt) {
        const existing = await this.recordRepo.findOne({ where: { session_id: sessionId, member_id: memberId } });
        if (existing) {
            await this.recordRepo.update(existing.id, { present, checked_in_at: checkedInAt });
            return this.recordRepo.findOne({ where: { id: existing.id } });
        }
        const entity = this.recordRepo.create({ session_id: sessionId, member_id: memberId, present, checked_in_at: checkedInAt });
        return this.recordRepo.save(entity);
    }
    async findRecordsBySession(sessionId) {
        return this.recordRepo.find({
            where: { session_id: sessionId },
            relations: ['member'],
            order: { member: { name: 'ASC' } },
        });
    }
    async recordExists(sessionId, memberId) {
        const count = await this.recordRepo.count({ where: { session_id: sessionId, member_id: memberId, present: true } });
        return count > 0;
    }
    async createToken(sessionId, memberId, token, expiresAt) {
        const existing = await this.tokenRepo.findOne({ where: { session_id: sessionId, member_id: memberId } });
        if (existing) {
            await this.tokenRepo.update(existing.id, { token, expires_at: expiresAt, used: false });
            return this.tokenRepo.findOne({ where: { id: existing.id } });
        }
        const entity = this.tokenRepo.create({ session_id: sessionId, member_id: memberId, token, expires_at: expiresAt });
        return this.tokenRepo.save(entity);
    }
    async findTokenByValue(token) {
        return this.tokenRepo.findOne({ where: { token }, relations: ['session', 'member'] });
    }
    async markTokenUsed(id) {
        await this.tokenRepo.update(id, { used: true });
    }
};
exports.AttendanceRepository = AttendanceRepository;
exports.AttendanceRepository = AttendanceRepository = __decorate([
    (0, common_1.Injectable)()
], AttendanceRepository);
let FormRepository = class FormRepository {
    constructor() {
        this.formRepo = db_1.AppDataBase.getRepository(form_1.Form);
        this.questionRepo = db_1.AppDataBase.getRepository(form_1.FormQuestion);
        this.optionRepo = db_1.AppDataBase.getRepository(form_1.FormOption);
        this.responseRepo = db_1.AppDataBase.getRepository(form_1.FormResponse);
        this.answerRepo = db_1.AppDataBase.getRepository(form_1.FormAnswer);
    }
    async createForm(data) {
        const entity = this.formRepo.create(data);
        return this.formRepo.save(entity);
    }
    async findFormById(id) {
        return this.formRepo.findOne({
            where: { id },
            relations: ['questions', 'questions.options', 'creator'],
            order: { questions: { position: 'ASC' } },
        });
    }
    async findFormBySlug(slug) {
        return this.formRepo.findOne({
            where: { public_slug: slug },
            relations: ['questions', 'questions.options'],
            order: { questions: { position: 'ASC' } },
        });
    }
    async addQuestion(formId, data, options) {
        const lastPos = await this.questionRepo
            .createQueryBuilder('q')
            .select('MAX(q.position)', 'max')
            .where('q.form_id = :formId', { formId })
            .getRawOne();
        const position = (lastPos?.max ?? 0) + 1;
        const question = this.questionRepo.create({ ...data, form_id: formId, position });
        const saved = await this.questionRepo.save(question);
        if (options?.length) {
            const opts = options.map((o, i) => this.optionRepo.create({ question_id: saved.id, label: o.label, position: i + 1 }));
            await this.optionRepo.save(opts);
        }
        return this.questionRepo.findOne({ where: { id: saved.id }, relations: ['options'] });
    }
    async reorderQuestions(formId, questionIds) {
        for (let i = 0; i < questionIds.length; i++) {
            await this.questionRepo.update({ id: questionIds[i], form_id: formId }, { position: i + 1 });
        }
    }
    async createResponse(formId, memberId, answers) {
        const response = this.responseRepo.create({ form_id: formId, member_id: memberId ?? undefined });
        const savedResponse = await this.responseRepo.save(response);
        const answerEntities = answers.map((a) => this.answerRepo.create({ response_id: savedResponse.id, question_id: a.question_id, value: a.value }));
        await this.answerRepo.save(answerEntities);
        return savedResponse;
    }
    async countResponsesByMember(formId, memberId) {
        return this.responseRepo.count({ where: { form_id: formId, member_id: memberId } });
    }
    async getResults(formId) {
        const questions = await this.questionRepo.find({
            where: { form_id: formId },
            relations: ['options'],
            order: { position: 'ASC' },
        });
        const totalResponses = await this.responseRepo.count({ where: { form_id: formId } });
        const results = await Promise.all(questions.map(async (q) => {
            const answers = await this.answerRepo.find({ where: { question_id: q.id } });
            return { question: q, answers };
        }));
        return { totalResponses, results };
    }
    async updateForm(id, data) {
        await this.formRepo.update(id, data);
        return this.findFormById(id);
    }
    async formSlugExists(slug) {
        const count = await this.formRepo.count({ where: { public_slug: slug } });
        return count > 0;
    }
};
exports.FormRepository = FormRepository;
exports.FormRepository = FormRepository = __decorate([
    (0, common_1.Injectable)()
], FormRepository);
