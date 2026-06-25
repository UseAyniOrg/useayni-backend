import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { FormRepository } from '../repositories/AttendanceFormRepositories';
import {
  CreateFormDto,
  CreateFormQuestionDto,
  ReorderQuestionsDto,
  SubmitFormResponseDto,
} from '../dto/miscellaneous/form.dto';
import { QuestionType } from '../models/form';

const CLOSED_QUESTION_TYPES = [QuestionType.SINGLE, QuestionType.MULTIPLE, QuestionType.SELECT];

@Injectable()
export class FormService {
  constructor(private readonly formRepo: FormRepository) {}

  async createForm(dto: CreateFormDto, creatorId: string) {
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

  async getForm(id: string) {
    const form = await this.formRepo.findFormById(id);
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

  async getFormBySlug(slug: string) {
    const form = await this.formRepo.findFormBySlug(slug);
    if (!form) throw new NotFoundException('Formulário não encontrado');
    return form;
  }

  async addQuestion(formId: string, dto: CreateFormQuestionDto, creatorId: string) {
    const form = await this.getForm(formId);
    if (form.created_by !== creatorId)
      throw new ForbiddenException('Apenas o criador pode adicionar perguntas');

    if (CLOSED_QUESTION_TYPES.includes(dto.type) && (!dto.options || dto.options.length < 2)) {
      throw new BadRequestException('Perguntas fechadas exigem ao menos 2 opções');
    }

    return this.formRepo.addQuestion(
      formId,
      {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        required: dto.required ?? false,
        scale_min: dto.scale_min,
        scale_max: dto.scale_max,
      },
      dto.options
    );
  }

  async reorderQuestions(formId: string, dto: ReorderQuestionsDto, creatorId: string) {
    const form = await this.getForm(formId);
    if (form.created_by !== creatorId)
      throw new ForbiddenException('Apenas o criador pode reordenar perguntas');
    await this.formRepo.reorderQuestions(formId, dto.question_ids);
  }

  async submitResponse(formId: string, dto: SubmitFormResponseDto, userId: string | null) {
    const form = await this.getForm(formId);

    if (form.end_date && form.end_date < new Date()) {
      throw new BadRequestException('Formulário encerrado');
    }

    if (userId && form.response_limit_type === 'once') {
      const count = await this.formRepo.countResponsesByMember(formId, userId);
      if (count > 0) {
        throw new BadRequestException('Este formulário aceita apenas uma resposta por membro');
      }
    }

    if (userId && form.response_limit_type === 'limited' && form.max_responses_per_user) {
      const count = await this.formRepo.countResponsesByMember(formId, userId);
      if (count >= form.max_responses_per_user) {
        throw new BadRequestException('Limite de respostas atingido');
      }
    }

    // Validate required questions
    const required = form.questions?.filter(q => q.required) ?? [];
    for (const q of required) {
      const answer = dto.answers.find(a => a.question_id === q.id);
      if (!answer?.value) {
        throw new BadRequestException(`Pergunta obrigatória não respondida: ${q.title}`);
      }
    }

    const memberId = form.anonymous ? null : userId;
    return this.formRepo.createResponse(formId, memberId, dto.answers);
  }

  async getResults(formId: string, requesterId: string) {
    const form = await this.getForm(formId);
    const isOwner = form.created_by === requesterId;
    if (!isOwner && form.results_visibility === 'owner') {
      throw new ForbiddenException('Resultados restritos ao dono do formulário');
    }
    if (!isOwner && form.results_visibility === 'members' && !requesterId) {
      throw new ForbiddenException('Resultados restritos aos membros');
    }
    return this.formRepo.getResults(formId);
  }

  private async generatePublicSlug(title: string): Promise<string | undefined> {
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
}
