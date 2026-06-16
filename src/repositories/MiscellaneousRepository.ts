import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { Miscellaneous } from '../models/miscellaneous';
import { MiscellaneousOwner } from '../models/miscellaneousOwner';
import { MiscellaneousMember } from '../models/miscellaneousMember';
import {
  MiscellaneousNotification,
} from '../models/miscellaneousNotification';
import {
  MiscellaneousMemberStatus,
  MiscellaneousStatus,
  MiscellaneousVisibility,
} from '../helpers/miscellaneous.enums';

export interface CreateMiscellaneousData {
  miscellaneous: Partial<Miscellaneous>;
  /** member_ids dos donos (o criador já deve estar incluído). */
  ownerIds: string[];
  /** member_ids dos membros iniciais/convidados. */
  memberIds: string[];
  /** Notificações a registrar atomicamente junto da criação. */
  notifications: Partial<MiscellaneousNotification>[];
}

@Injectable()
export class MiscellaneousRepository {
  private repository = AppDataBase.getRepository(Miscellaneous);

  async findById(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ['parent', 'owners', 'owners.member', 'members', 'members.member'],
    });
  }

  /** Listagem pública: apenas miscelâneas ativas e públicas. */
  async findPublicActive() {
    return this.repository.find({
      where: {
        status: MiscellaneousStatus.ATIVA,
        visibility: MiscellaneousVisibility.PUBLICO,
      },
      relations: ['owners'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Cria a miscelânea, seus donos, membros iniciais e notificações em uma
   * única transação.
   */
  async createWithRelations(data: CreateMiscellaneousData): Promise<Miscellaneous> {
    return AppDataBase.transaction(async (manager) => {
      const misc = manager.create(Miscellaneous, data.miscellaneous);
      const savedMisc = await manager.save(misc);

      const creatorId = savedMisc.creator_id;
      const uniqueOwnerIds = Array.from(new Set(data.ownerIds));
      const owners = uniqueOwnerIds.map((memberId) =>
        manager.create(MiscellaneousOwner, {
          miscellaneous_id: savedMisc.id,
          member_id: memberId,
          is_primary: memberId === creatorId,
        }),
      );
      if (owners.length > 0) await manager.save(owners);

      const uniqueMemberIds = Array.from(new Set(data.memberIds)).filter(
        (memberId) => !uniqueOwnerIds.includes(memberId),
      );
      const members = uniqueMemberIds.map((memberId) =>
        manager.create(MiscellaneousMember, {
          miscellaneous_id: savedMisc.id,
          member_id: memberId,
          status: MiscellaneousMemberStatus.PENDENTE,
        }),
      );
      if (members.length > 0) await manager.save(members);

      if (data.notifications.length > 0) {
        const notifications = data.notifications.map((n) =>
          manager.create(MiscellaneousNotification, {
            ...n,
            miscellaneous_id: savedMisc.id,
          }),
        );
        await manager.save(notifications);
      }

      return savedMisc;
    });
  }

  async updateStatus(id: string, status: MiscellaneousStatus) {
    await this.repository.update(id, { status });
    return this.findById(id);
  }

  async findInvitation(miscellaneousId: string, memberId: string) {
    return AppDataBase.getRepository(MiscellaneousMember).findOne({
      where: { miscellaneous_id: miscellaneousId, member_id: memberId },
    });
  }

  async saveInvitation(invitation: MiscellaneousMember) {
    return AppDataBase.getRepository(MiscellaneousMember).save(invitation);
  }

  async saveNotification(notification: Partial<MiscellaneousNotification>) {
    const repo = AppDataBase.getRepository(MiscellaneousNotification);
    return repo.save(repo.create(notification));
  }

  /**
   * Retorna os member_ids dos gestores responsáveis por aprovar um escopo
   * (RN-002). Notifica todos os gestores do nível-alvo.
   */
  async findManagerIdsForScope(scope: string): Promise<string[]> {
    let rows: { member_id: string }[] = [];

    if (scope === 'car') {
      rows = await AppDataBase.query(
        'SELECT DISTINCT member_id FROM car_managers',
      );
    } else if (scope === 'cae') {
      rows = await AppDataBase.query(
        'SELECT DISTINCT member_id FROM cae_managers WHERE deleted_at IS NULL',
      );
    } else if (scope === 'geral') {
      rows = await AppDataBase.query(
        `SELECT mr.member_id
           FROM member_roles mr
           JOIN roles r ON r.id = mr.role_id
          WHERE r.name = 'EQUIPE_TECNICA'`,
      );
    }

    return rows.map((r) => r.member_id);
  }
}
