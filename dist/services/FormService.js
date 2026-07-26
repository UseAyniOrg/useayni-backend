"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormService = void 0;
const common_1 = require("@nestjs/common");
const AttendanceFormRepositories_1 = require("../repositories/AttendanceFormRepositories");
const form_1 = require("../models/form");
const CLOSED_QUESTION_TYPES = [form_1.QuestionType.SINGLE, form_1.QuestionType.MULTIPLE, form_1.QuestionType.SELECT];
let FormService = class FormService {
    constructor(formRepo) {
        this.formRepo = formRepo;
    }
    async createForm(dto, creatorId) {
        const publicSlug = dto.public_results_enabled
            ? await this.generatePublicSlug(dto.title)
            : undefined;
        return this.formRepo.createForm({
            ...dto,
            public_slug: publicSlug,
            start_date: dto.start_date ? new Date(dto.start_date) : undefined,
            end_date: dto.end_date ? new Date(dto.end_date) : undefined,
            created_by: creatorId,
        });
    }
    async getForm(id) {
        const form = await this.formRepo.findFormById(id);
        if (!form)
            throw new common_1.NotFoundException('Formulário não encontrado');
        return form;
    }
    async getFormBySlug(slug) {
        const form = await this.formRepo.findFormBySlug(slug);
        if (!form)
            throw new common_1.NotFoundException('Formulário não encontrado');
        return form;
    }
    async addQuestion(formId, dto, creatorId) {
        const form = await this.getForm(formId);
        if (form.created_by !== creatorId)
            throw new common_1.ForbiddenException('Apenas o criador pode adicionar perguntas');
        if (CLOSED_QUESTION_TYPES.includes(dto.type) && (!dto.options || dto.options.length < 2)) {
            throw new common_1.BadRequestException('Perguntas fechadas exigem ao menos 2 opções');
        }
        return this.formRepo.addQuestion(formId, {
            type: dto.type,
            title: dto.title,
            description: dto.description,
            required: dto.required ?? false,
            scale_min: dto.scale_min,
            scale_max: dto.scale_max,
        }, dto.options);
    }
    async reorderQuestions(formId, dto, creatorId) {
        const form = await this.getForm(formId);
        if (form.created_by !== creatorId)
            throw new common_1.ForbiddenException('Apenas o criador pode reordenar perguntas');
        await this.formRepo.reorderQuestions(formId, dto.question_ids);
    }
    async submitResponse(formId, dto, userId) {
        const form = await this.getForm(formId);
        if (form.end_date && form.end_date < new Date()) {
            throw new common_1.BadRequestException('Formulário encerrado');
        }
        if (userId && form.response_limit_type === 'once') {
            const count = await this.formRepo.countResponsesByMember(formId, userId);
            if (count > 0) {
                throw new common_1.BadRequestException('Este formulário aceita apenas uma resposta por membro');
            }
        }
        if (userId && form.response_limit_type === 'limited' && form.max_responses_per_user) {
            const count = await this.formRepo.countResponsesByMember(formId, userId);
            if (count >= form.max_responses_per_user) {
                throw new common_1.BadRequestException('Limite de respostas atingido');
            }
        }
        // Validate required questions
        const required = form.questions?.filter(q => q.required) ?? [];
        for (const q of required) {
            const answer = dto.answers.find(a => a.question_id === q.id);
            if (!answer?.value) {
                throw new common_1.BadRequestException(`Pergunta obrigatória não respondida: ${q.title}`);
            }
        }
        const memberId = form.anonymous ? null : userId;
        return this.formRepo.createResponse(formId, memberId, dto.answers);
    }
    async getResults(formId, requesterId) {
        const form = await this.getForm(formId);
        const isOwner = form.created_by === requesterId;
        if (!isOwner && form.results_visibility === 'owner') {
            throw new common_1.ForbiddenException('Resultados restritos ao dono do formulário');
        }
        if (!isOwner && form.results_visibility === 'members' && !requesterId) {
            throw new common_1.ForbiddenException('Resultados restritos aos membros');
        }
        return this.formRepo.getResults(formId);
    }
    async generatePublicSlug(title) {
        const base = title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .slice(0, 60);
        const suffix = Math.random().toString(36).slice(2, 7);
        return `${base || 'form'}-${suffix}`;
    }
};
exports.FormService = FormService;
exports.FormService = FormService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AttendanceFormRepositories_1.FormRepository])
], FormService);
