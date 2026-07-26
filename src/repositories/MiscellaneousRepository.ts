import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { Miscellaneous, MiscellaneousStatus } from '../models/miscellaneous';
import { MiscellaneousFiltersDto } from '../dto/miscellaneous/miscellaneous.dto';

@Injectable()
export class MiscellaneousRepository {
  private repo = AppDataBase.getRepository(Miscellaneous);

  async create(data: Partial<Miscellaneous>): Promise<Miscellaneous> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async findById(id: string): Promise<Miscellaneous | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['creator', 'parent'],
    });
  }

  async findByIdWithChildren(id: string): Promise<Miscellaneous | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['creator', 'parent', 'children'],
    });
  }

  async findBySlug(slug: string): Promise<Miscellaneous | null> {
    return this.repo.findOne({ where: { public_slug: slug } });
  }

  async update(id: string, data: Partial<Miscellaneous>): Promise<Miscellaneous | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async archive(id: string): Promise<void> {
    await this.repo.update(id, { status: MiscellaneousStatus.ARCHIVED });
  }

  async findWithFilters(
    filters: MiscellaneousFiltersDto,
    userId: string,
  ): Promise<{ data: Miscellaneous[]; total: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;

    let query = this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.creator', 'creator')
      .leftJoin('miscellaneous_owners', 'mo', 'mo.miscellaneous_id = m.id')
      .leftJoin('miscellaneous_participants', 'mp', 'mp.miscellaneous_id = m.id')
      .where('m.deleted_at IS NULL')
      .andWhere(
        `(m.participation_type = 'public' OR m.scope = 'general' OR mo.member_id = :uid OR mp.member_id = :uid OR m.created_by = :uid)`,
        { uid: userId },
      )
      .groupBy('m.id, creator.id');

    if (filters.type) query = query.andWhere('m.type = :type', { type: filters.type });
    if (filters.status) query = query.andWhere('m.status = :status', { status: filters.status });
    if (filters.visibility) query = query.andWhere('m.visibility = :visibility', { visibility: filters.visibility });
    if (filters.scope) query = query.andWhere('m.scope = :scope', { scope: filters.scope });
    if (filters.search) {
      query = query.andWhere('(m.title ILIKE :search OR m.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }
    if (filters.myRole === 'owner') {
      query = query.andWhere('mo.member_id = :uid', { uid: userId });
    } else if (filters.myRole === 'participant') {
      query = query.andWhere('mp.member_id = :uid', { uid: userId });
    } else if (filters.myRole === 'creator') {
      query = query.andWhere('m.created_by = :uid', { uid: userId });
    }

    const sortMap: Record<string, string> = {
      title: 'm.title',
      start_date: 'm.start_date',
      created_at: 'm.created_at',
    };
    const orderField = sortMap[filters.sortBy ?? ''] ?? 'm.created_at';
    query = query.orderBy(orderField, 'DESC');

    const [data, total] = await query
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findChildren(parentId: string): Promise<Miscellaneous[]> {
    return this.repo.find({
      where: { parent_id: parentId },
      order: { type: 'ASC', created_at: 'ASC' },
    });
  }

  async findPendingForApproval(): Promise<Miscellaneous[]> {
    return this.repo.find({
      where: { status: MiscellaneousStatus.PENDING_APPROVAL },
      relations: ['creator'],
      order: { created_at: 'ASC' },
    });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.repo.count({ where: { public_slug: slug } });
    return count > 0;
  }
}
