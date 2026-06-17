import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { University } from "../models/university";

@Injectable()
export class UniversityRepository {
  private repository = AppDataBase.getRepository(University);

  async findAll() {
    return this.repository.find();
  }

  async findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ["courseUniversities", "courseUniversities.course"],
    });
  }

  async create(data: Partial<University>) {
    const university = this.repository.create(data);
    return this.repository.save(university);
  }

  async update(id: string, data: Partial<University>) {
    await this.repository.update(id, data);
    return this.findById(id);
  }
}
