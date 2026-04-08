import { AppDataBase } from '../db';
import { CaeManager } from '../models/caeManager';

export const CaeManagerRepository = AppDataBase.getRepository(CaeManager).extend({
  async findByMemberId(memberId: string): Promise<CaeManager[]> {
    return this.find({
      where: { 
        member_id: memberId,
        end_date: null // apenas gestores ativos
      },
      relations: ['cae', 'cae.state'],
    });
  },

  async findByCaeId(caeId: string): Promise<CaeManager[]> {
    return this.find({
      where: { cae_id: caeId },
      relations: ['member'],
    });
  },

  async isManager(memberId: string, caeId: string): Promise<boolean> {
    const count = await this.count({
      where: {
        member_id: memberId,
        cae_id: caeId,
        end_date: null,
      },
    });
    return count > 0;
  },
});
