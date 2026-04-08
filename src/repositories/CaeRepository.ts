import { AppDataBase } from '../db';
import { Cae } from '../models/cae';

export const CaeRepository = AppDataBase.getRepository(Cae).extend({
  async findByStateId(stateId: string): Promise<Cae[]> {
    return this.find({
      where: { state_id: stateId },
      relations: ['state', 'managers', 'managers.member', 'cars'],
    });
  },

  async findWithManagers(id: string): Promise<Cae | null> {
    return this.findOne({
      where: { id },
      relations: ['state', 'managers', 'managers.member', 'cars'],
    });
  },
});
