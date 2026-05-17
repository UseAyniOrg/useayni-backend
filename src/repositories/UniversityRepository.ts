import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { University } from "../models/university";

@Injectable()
export class UniversityRepository {
  private repository = AppDataBase.getRepository(University);

  async findAll(filters?: { cityId?: string; stateId?: string; stateUf?: string; q?: string }) {
    const query = this.repository
      .createQueryBuilder("university")
      .leftJoinAndSelect("university.city", "city")
      .leftJoinAndSelect("city.state", "state")
      .leftJoinAndSelect("university.courseUniversities", "courseUniversities")
      .leftJoinAndSelect("courseUniversities.city", "courseUniversityCity")
      .leftJoinAndSelect("courseUniversityCity.state", "courseUniversityState")
      .leftJoinAndSelect("courseUniversities.course", "course");

    if (filters?.cityId) {
      query.andWhere(
        "(university.city_id = :cityId OR courseUniversities.city_id = :cityId)",
        { cityId: filters.cityId },
      );
    }

    if (filters?.stateId) {
      query.andWhere(
        "(city.state_id = :stateId OR courseUniversityCity.state_id = :stateId)",
        { stateId: filters.stateId },
      );
    }

    if (filters?.stateUf) {
      query.andWhere(
        "(UPPER(state.uf) = :stateUf OR UPPER(courseUniversityState.uf) = :stateUf)",
        { stateUf: filters.stateUf.toUpperCase() },
      );
    }

    if (filters?.q) {
      query.andWhere(
        "(university.name ILIKE :q OR university.acronym ILIKE :q)",
        { q: `%${filters.q}%` },
      );
    }

    return query.distinct(true).orderBy("university.name", "ASC").getMany();
  }

  async findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ["city", "city.state", "courseUniversities", "courseUniversities.course"],
    });
  }

  async findByEmecCode(emecCode: string) {
    return this.repository.findOne({
      where: { emec_code: emecCode },
      relations: ["city", "city.state"],
    });
  }

  async findByNormalizedName(name: string, cityId?: string) {
    const query = this.repository
      .createQueryBuilder("university")
      .leftJoinAndSelect("university.city", "city")
      .leftJoinAndSelect("city.state", "state")
      .where("LOWER(university.name) = LOWER(:name)", { name });

    if (cityId) {
      query.andWhere("university.city_id = :cityId", { cityId });
    }

    return query.getOne();
  }

  async findOrCreateByNormalizedName(data: {
    name: string;
    acronym?: string | null;
    emec_code?: string | null;
    city_id?: string | null;
    source?: string | null;
  }) {
    if (data.emec_code) {
      const byCode = await this.findByEmecCode(data.emec_code);
      if (byCode) return byCode;
    }

    const existing = await this.findByNormalizedName(
      data.name,
      data.city_id || undefined,
    );
    if (existing) return existing;

    return this.create({
      name: data.name,
      acronym: data.acronym || null,
      emec_code: data.emec_code || null,
      city_id: data.city_id || null,
      source: data.source || 'USER_SIGNUP',
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
