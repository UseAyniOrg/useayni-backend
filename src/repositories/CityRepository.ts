import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { City } from "../models/city";

@Injectable()
export class CityRepository {
  private repository = AppDataBase.getRepository(City);

  async findAll() {
    return this.repository.find({
      relations: ["state"],
      order: { name: "ASC" },
    });
  }

  async findById(id: string) {
    return this.repository.findOne({ where: { id }, relations: ["state"] });
  }

  async findByState(stateId: string) {
    return this.repository.find({
      where: { state_id: stateId },
      relations: ["state"],
      order: { name: "ASC" },
    });
  }

  async findByStateUf(uf: string) {
    return this.repository
      .createQueryBuilder("city")
      .leftJoinAndSelect("city.state", "state")
      .where("UPPER(state.uf) = :uf", { uf: uf.toUpperCase() })
      .orderBy("city.name", "ASC")
      .getMany();
  }

  async findByIbgeCode(ibgeCode: string) {
    return this.repository.findOne({
      where: { ibge_code: ibgeCode },
      relations: ["state"],
    });
  }

  async findOrCreateFromIbge(data: {
    name: string;
    ibge_code: string;
    state_id: string;
  }) {
    const existing = await this.findByIbgeCode(data.ibge_code);
    if (existing) {
      await this.repository.update(existing.id, {
        name: data.name,
        state_id: data.state_id,
      });
      return this.findById(existing.id);
    }

    return this.create(data);
  }

  async create(data: Partial<City>) {
    const city = this.repository.create(data);
    return this.repository.save(city);
  }
}
