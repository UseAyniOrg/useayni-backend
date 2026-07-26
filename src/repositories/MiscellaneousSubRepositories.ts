import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { MiscellaneousOwner, OwnerRole } from '../models/miscellaneousOwner';
import { MiscellaneousParticipant } from '../models/miscellaneousParticipant';
import { MiscellaneousWaitlist, WaitlistStatus } from '../models/miscellaneousWaitlist';
import { MiscellaneousRequest, RequestStatus } from '../models/miscellaneousRequest';
import { MiscellaneousInvite, InviteStatus } from '../models/miscellaneousInvite';
import { MiscellaneousApprovalLog, ApprovalAction } from '../models/miscellaneousApprovalLog';

@Injectable()
export class MiscellaneousOwnerRepository {
  private repo = AppDataBase.getRepository(MiscellaneousOwner);

  async add(miscellaneousId: string, memberId: string, role: OwnerRole, isCreator = false) {
    const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId, role, is_creator: isCreator });
    return this.repo.save(entity);
  }

  async remove(miscellaneousId: string, memberId: string) {
    await this.repo.delete({ miscellaneous_id: miscellaneousId, member_id: memberId });
  }

  async findByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId },
      relations: ['member'],
    });
  }

  async findOne(miscellaneousId: string, memberId: string) {
    return this.repo.findOne({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
  }

  async countOwners(miscellaneousId: string): Promise<number> {
    return this.repo.count({ where: { miscellaneous_id: miscellaneousId } });
  }

  async isOwner(miscellaneousId: string, memberId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
    return count > 0;
  }
}

@Injectable()
export class MiscellaneousParticipantRepository {
  private repo = AppDataBase.getRepository(MiscellaneousParticipant);

  async add(miscellaneousId: string, memberId: string) {
    const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId });
    return this.repo.save(entity);
  }

  async remove(miscellaneousId: string, memberId: string) {
    await this.repo.delete({ miscellaneous_id: miscellaneousId, member_id: memberId });
  }

  async findByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId },
      relations: ['member'],
    });
  }

  async isParticipant(miscellaneousId: string, memberId: string): Promise<boolean> {
    const count = await this.repo.count({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
    return count > 0;
  }

  async countParticipants(miscellaneousId: string): Promise<number> {
    return this.repo.count({ where: { miscellaneous_id: miscellaneousId } });
  }
}

@Injectable()
export class MiscellaneousWaitlistRepository {
  private repo = AppDataBase.getRepository(MiscellaneousWaitlist);

  async add(miscellaneousId: string, memberId: string): Promise<MiscellaneousWaitlist> {
    const lastPosition = await this.repo
      .createQueryBuilder('w')
      .select('MAX(w.position)', 'max')
      .where('w.miscellaneous_id = :id AND w.status = :status', { id: miscellaneousId, status: WaitlistStatus.WAITING })
      .getRawOne();
    const position = (lastPosition?.max ?? 0) + 1;
    const entity = this.repo.create({ miscellaneous_id: miscellaneousId, member_id: memberId, position });
    return this.repo.save(entity);
  }

  async findByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId, status: WaitlistStatus.WAITING },
      relations: ['member'],
      order: { position: 'ASC' },
    });
  }

  async findByMember(miscellaneousId: string, memberId: string) {
    return this.repo.findOne({ where: { miscellaneous_id: miscellaneousId, member_id: memberId } });
  }

  async promote(miscellaneousId: string, memberId: string) {
    await this.repo.update(
      { miscellaneous_id: miscellaneousId, member_id: memberId },
      { status: WaitlistStatus.PROMOTED },
    );
    await this.recalculatePositions(miscellaneousId);
  }

  private async recalculatePositions(miscellaneousId: string) {
    const waiting = await this.repo.find({
      where: { miscellaneous_id: miscellaneousId, status: WaitlistStatus.WAITING },
      order: { position: 'ASC' },
    });
    for (let i = 0; i < waiting.length; i++) {
      await this.repo.update(waiting[i].id, { position: i + 1 });
    }
  }
}

@Injectable()
export class MiscellaneousRequestRepository {
  private repo = AppDataBase.getRepository(MiscellaneousRequest);

  async create(data: Partial<MiscellaneousRequest>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['member', 'miscellaneous'] });
  }

  async findByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId },
      relations: ['member'],
      order: { created_at: 'DESC' },
    });
  }

  async findActivByMember(miscellaneousId: string, memberId: string) {
    return this.repo.findOne({
      where: { miscellaneous_id: miscellaneousId, member_id: memberId, status: RequestStatus.PENDING },
    });
  }

  async update(id: string, data: Partial<MiscellaneousRequest>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async expireOld(before: Date) {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: RequestStatus.EXPIRED })
      .where('status = :status AND expires_at < :before', { status: RequestStatus.PENDING, before })
      .execute();
  }
}

@Injectable()
export class MiscellaneousInviteRepository {
  private repo = AppDataBase.getRepository(MiscellaneousInvite);

  async create(data: Partial<MiscellaneousInvite>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['invitedUser', 'invitedBy', 'miscellaneous'] });
  }

  async findPendingByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId, status: InviteStatus.PENDING },
      relations: ['invitedUser'],
      order: { created_at: 'DESC' },
    });
  }

  async findPendingForUser(memberId: string) {
    return this.repo.find({
      where: { invited_user_id: memberId, status: InviteStatus.PENDING },
      relations: ['miscellaneous', 'invitedBy'],
      order: { created_at: 'DESC' },
    });
  }

  async hasPendingInvite(miscellaneousId: string, memberId: string): Promise<boolean> {
    const count = await this.repo.count({
      where: { miscellaneous_id: miscellaneousId, invited_user_id: memberId, status: InviteStatus.PENDING },
    });
    return count > 0;
  }

  async update(id: string, data: Partial<MiscellaneousInvite>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async expireOld(before: Date) {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ status: InviteStatus.EXPIRED })
      .where('status = :status AND expires_at < :before', { status: InviteStatus.PENDING, before })
      .execute();
  }
}

@Injectable()
export class MiscellaneousApprovalLogRepository {
  private repo = AppDataBase.getRepository(MiscellaneousApprovalLog);

  async create(miscellaneousId: string, actorUserId: string, action: ApprovalAction, comment?: string) {
    const entity = this.repo.create({ miscellaneous_id: miscellaneousId, actor_user_id: actorUserId, action, comment });
    return this.repo.save(entity);
  }

  async findByMiscellaneous(miscellaneousId: string) {
    return this.repo.find({
      where: { miscellaneous_id: miscellaneousId },
      relations: ['actor'],
      order: { created_at: 'ASC' },
    });
  }
}
