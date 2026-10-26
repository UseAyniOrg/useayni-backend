import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { MemberCourse } from '../models/memberCourse';

@Injectable()
export class MemberCourseRepository {
  private repository = AppDataBase.getRepository(MemberCourse);

  async findByMemberId(memberId: string) {
    return this.repository.find({
      where: { member_id: memberId },
      relations: [
        'courseUniversity',
        'courseUniversity.course',
        'courseUniversity.university',
        'courseUniversity.city',
      ],
    });
  }

  async findByMemberAndCourseUniversity(memberId: string, courseUniversityId: string) {
    return this.repository.findOne({
      where: { member_id: memberId, course_university_id: courseUniversityId },
      relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university'],
    });
  }

  async findActiveByCourseUniversity(courseUniversityId: string) {
    return this.repository.find({
      where: {
        course_university_id: courseUniversityId,
        status: 'active' as any,
      },
      relations: ['member'],
    });
  }

  async create(data: Partial<MemberCourse>) {
    const memberCourse = this.repository.create(data);
    return this.repository.save(memberCourse);
  }

  async update(id: string, data: Partial<MemberCourse>) {
    await this.repository.update(id, data);
    return this.repository.findOne({
      where: { id },
      relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university'],
    });
  }

  async findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: [
        'courseUniversity',
        'courseUniversity.course',
        'courseUniversity.university',
        'member',
      ],
    });
  }
}
