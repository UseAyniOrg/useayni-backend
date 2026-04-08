import { AppDataBase } from '../db';
import { CourseManager } from '../models/courseManager';

export const CourseManagerRepository = AppDataBase.getRepository(CourseManager).extend({
  async findByMemberId(memberId: string): Promise<CourseManager[]> {
    return this.find({
      where: { 
        member_id: memberId,
        end_date: null // apenas dirigentes ativos
      },
      relations: ['courseUniversity', 'courseUniversity.course', 'courseUniversity.university', 'courseUniversity.city'],
    });
  },

  async findByCourseUniversityId(courseUniversityId: string): Promise<CourseManager[]> {
    return this.find({
      where: { course_university_id: courseUniversityId },
      relations: ['member'],
    });
  },

  async isManager(memberId: string, courseUniversityId: string): Promise<boolean> {
    const count = await this.count({
      where: {
        member_id: memberId,
        course_university_id: courseUniversityId,
        end_date: null,
      },
    });
    return count > 0;
  },
});
