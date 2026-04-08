import { Injectable } from '@nestjs/common';
import { CourseManagerRepository } from '../repositories/CourseManagerRepository';

@Injectable()
export class CourseManagerService {
  constructor() {}

  async findAll() {
    return CourseManagerRepository.find({
      relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university', 'courseUniversity.city', 'member'],
    });
  }

  async findById(id: string) {
    return CourseManagerRepository.findOne({
      where: { id },
      relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university', 'courseUniversity.city', 'member'],
    });
  }

  async findByMemberId(memberId: string) {
    return CourseManagerRepository.findByMemberId(memberId);
  }

  async findByCourseUniversityId(courseUniversityId: string) {
    return CourseManagerRepository.findByCourseUniversityId(courseUniversityId);
  }

  async create(data: { course_university_id: string; member_id: string; start_date?: Date }) {
    const manager = CourseManagerRepository.create(data);
    return CourseManagerRepository.save(manager);
  }

  async endManagement(id: string) {
    const manager = await CourseManagerRepository.findOne({ where: { id } });
    if (!manager) throw new Error('Dirigente não encontrado');
    
    manager.end_date = new Date();
    return CourseManagerRepository.save(manager);
  }

  async delete(id: string) {
    await CourseManagerRepository.softDelete(id);
  }

  async isManager(memberId: string, courseUniversityId: string) {
    return CourseManagerRepository.isManager(memberId, courseUniversityId);
  }
}
