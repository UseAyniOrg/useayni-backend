import { Injectable } from '@nestjs/common';
import { CaeRepository } from '../repositories/CaeRepository';
import { CaeManagerRepository } from '../repositories/CaeManagerRepository';

@Injectable()
export class CaeService {
  constructor() {}

  async findAll() {
    return CaeRepository.find({
      relations: ['state', 'managers', 'managers.member', 'cars'],
    });
  }

  async findById(id: string) {
    return CaeRepository.findWithManagers(id);
  }

  async findByStateId(stateId: string) {
    return CaeRepository.findByStateId(stateId);
  }

  async create(data: { name: string; state_id: string }) {
    const cae = CaeRepository.create(data);
    return CaeRepository.save(cae);
  }

  async update(id: string, data: Partial<{ name: string; state_id: string }>) {
    await CaeRepository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string) {
    await CaeRepository.softDelete(id);
  }

  async addManager(caeId: string, memberId: string, startDate?: Date) {
    const manager = CaeManagerRepository.create({
      cae_id: caeId,
      member_id: memberId,
      start_date: startDate || new Date(),
    });
    return CaeManagerRepository.save(manager);
  }

  async removeManager(caeId: string, memberId: string) {
    const manager = await CaeManagerRepository.findOne({
      where: { cae_id: caeId, member_id: memberId, end_date: null },
    });
    if (manager) {
      manager.end_date = new Date();
      await CaeManagerRepository.save(manager);
    }
  }

  async getManagers(caeId: string) {
    return CaeManagerRepository.findByCaeId(caeId);
  }

  async isManager(memberId: string, caeId: string) {
    return CaeManagerRepository.isManager(memberId, caeId);
  }
}
