import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { Course } from "../models/course";

@Injectable()
export class CourseRepository {
  private repository = AppDataBase.getRepository(Course);

  async findAll() {
    return this.repository.find({ relations: ["courseUniversities", "courseUniversities.university"] });
  }

  async findById(id: string) {
    return this.repository.findOne({ 
      where: { id }, 
      relations: ["courseUniversities", "courseUniversities.university"] 
    });
  }

  async findByUniversity(universityId: string, cityId?: string) {
    const query = this.repository
      .createQueryBuilder("course")
      .leftJoinAndSelect("course.courseUniversities", "cu")
      .leftJoinAndSelect("cu.university", "university")
      .where("cu.university_id = :universityId", { universityId });

    if (cityId) {
      query.andWhere("cu.city_id = :cityId", { cityId });
    }

    return query.orderBy("course.name", "ASC").getMany();
  }

  async findByNormalizedName(name: string) {
    return this.repository
      .createQueryBuilder("course")
      .where("LOWER(course.name) = LOWER(:name)", { name })
      .getOne();
  }

  async findOrCreateByName(name: string) {
    const existing = await this.findByNormalizedName(name);
    if (existing) return existing;

    return this.create({ name });
  }

  async create(data: Partial<Course>) {
    const course = this.repository.create(data);
    return this.repository.save(course);
  }

  async update(id: string, data: Partial<Course>) {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
