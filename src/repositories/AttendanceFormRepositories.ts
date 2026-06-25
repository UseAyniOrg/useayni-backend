import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { AttendanceSession, AttendanceRecord, AttendanceToken } from '../models/attendance';
import { Form, FormQuestion, FormOption, FormResponse, FormAnswer } from '../models/form';

@Injectable()
export class AttendanceRepository {
  private sessionRepo = AppDataBase.getRepository(AttendanceSession);
  private recordRepo = AppDataBase.getRepository(AttendanceRecord);
  private tokenRepo = AppDataBase.getRepository(AttendanceToken);

  async createSession(data: Partial<AttendanceSession>) {
    const entity = this.sessionRepo.create(data);
    return this.sessionRepo.save(entity);
  }

  async findSessionById(id: string) {
    return this.sessionRepo.findOne({ where: { id }, relations: ['miscellaneous'] });
  }

  async findSessionsByMiscellaneous(miscellaneousId: string) {
    return this.sessionRepo.find({
      where: { miscellaneous_id: miscellaneousId },
      order: { created_at: 'DESC' },
    });
  }

  async createOrUpdateRecord(sessionId: string, memberId: string, present: boolean, checkedInAt?: Date) {
    const existing = await this.recordRepo.findOne({ where: { session_id: sessionId, member_id: memberId } });
    if (existing) {
      await this.recordRepo.update(existing.id, { present, checked_in_at: checkedInAt });
      return this.recordRepo.findOne({ where: { id: existing.id } });
    }
    const entity = this.recordRepo.create({ session_id: sessionId, member_id: memberId, present, checked_in_at: checkedInAt });
    return this.recordRepo.save(entity);
  }

  async findRecordsBySession(sessionId: string) {
    return this.recordRepo.find({
      where: { session_id: sessionId },
      relations: ['member'],
      order: { member: { name: 'ASC' } },
    });
  }

  async recordExists(sessionId: string, memberId: string): Promise<boolean> {
    const count = await this.recordRepo.count({ where: { session_id: sessionId, member_id: memberId, present: true } });
    return count > 0;
  }

  async createToken(sessionId: string, memberId: string, token: string, expiresAt: Date) {
    const existing = await this.tokenRepo.findOne({ where: { session_id: sessionId, member_id: memberId } });
    if (existing) {
      await this.tokenRepo.update(existing.id, { token, expires_at: expiresAt, used: false });
      return this.tokenRepo.findOne({ where: { id: existing.id } });
    }
    const entity = this.tokenRepo.create({ session_id: sessionId, member_id: memberId, token, expires_at: expiresAt });
    return this.tokenRepo.save(entity);
  }

  async findTokenByValue(token: string) {
    return this.tokenRepo.findOne({ where: { token }, relations: ['session', 'member'] });
  }

  async markTokenUsed(id: string) {
    await this.tokenRepo.update(id, { used: true });
  }
}

@Injectable()
export class FormRepository {
  private formRepo = AppDataBase.getRepository(Form);
  private questionRepo = AppDataBase.getRepository(FormQuestion);
  private optionRepo = AppDataBase.getRepository(FormOption);
  private responseRepo = AppDataBase.getRepository(FormResponse);
  private answerRepo = AppDataBase.getRepository(FormAnswer);

  async createForm(data: Partial<Form>) {
    const entity = this.formRepo.create(data);
    return this.formRepo.save(entity);
  }

  async findFormById(id: string) {
    return this.formRepo.findOne({
      where: { id },
      relations: ['questions', 'questions.options', 'creator'],
      order: { questions: { position: 'ASC' } },
    });
  }

  async findFormBySlug(slug: string) {
    return this.formRepo.findOne({
      where: { public_slug: slug },
      relations: ['questions', 'questions.options'],
      order: { questions: { position: 'ASC' } },
    });
  }

  async addQuestion(formId: string, data: Partial<FormQuestion>, options?: { label: string }[]) {
    const lastPos = await this.questionRepo
      .createQueryBuilder('q')
      .select('MAX(q.position)', 'max')
      .where('q.form_id = :formId', { formId })
      .getRawOne();
    const position = (lastPos?.max ?? 0) + 1;
    const question = this.questionRepo.create({ ...data, form_id: formId, position });
    const saved = await this.questionRepo.save(question);
    if (options?.length) {
      const opts = options.map((o, i) =>
        this.optionRepo.create({ question_id: saved.id, label: o.label, position: i + 1 }),
      );
      await this.optionRepo.save(opts);
    }
    return this.questionRepo.findOne({ where: { id: saved.id }, relations: ['options'] });
  }

  async reorderQuestions(formId: string, questionIds: string[]) {
    for (let i = 0; i < questionIds.length; i++) {
      await this.questionRepo.update({ id: questionIds[i], form_id: formId }, { position: i + 1 });
    }
  }

  async createResponse(formId: string, memberId: string | null, answers: { question_id: string; value?: string }[]) {
    const response = this.responseRepo.create({ form_id: formId, member_id: memberId ?? undefined });
    const savedResponse = await this.responseRepo.save(response);
    const answerEntities = answers.map((a) =>
      this.answerRepo.create({ response_id: savedResponse.id, question_id: a.question_id, value: a.value }),
    );
    await this.answerRepo.save(answerEntities);
    return savedResponse;
  }

  async countResponsesByMember(formId: string, memberId: string): Promise<number> {
    return this.responseRepo.count({ where: { form_id: formId, member_id: memberId } });
  }

  async getResults(formId: string) {
    const questions = await this.questionRepo.find({
      where: { form_id: formId },
      relations: ['options'],
      order: { position: 'ASC' },
    });
    const totalResponses = await this.responseRepo.count({ where: { form_id: formId } });
    const results = await Promise.all(
      questions.map(async (q) => {
        const answers = await this.answerRepo.find({ where: { question_id: q.id } });
        return { question: q, answers };
      }),
    );
    return { totalResponses, results };
  }

  async updateForm(id: string, data: Partial<Form>) {
    await this.formRepo.update(id, data);
    return this.findFormById(id);
  }

  async formSlugExists(slug: string): Promise<boolean> {
    const count = await this.formRepo.count({ where: { public_slug: slug } });
    return count > 0;
  }
}
