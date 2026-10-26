import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { OrgUnitRepository } from '../repositories/OrgUnitRepository';
import { MandateStatus } from '../models/mandate';
import { AuditLog } from '../models/auditLog';
import { Member } from '../models/member';
import { AppDataBase } from '../db';
import { OrgUnit, OrgUnitStatus } from '../models/orgUnit';
import { InvestitureType } from '../models/position';

// ─── DTOs (inline for this service) ──────────────────────────────────────────

interface CreateTypeDto {
  organization_id: string;
  slug: string;
  name: string;
  metadata_schema?: Record<string, unknown>;
}

interface CreateUnitDto {
  organization_id: string;
  type_id: string;
  name: string;
  slug?: string;
  parent_id?: string;
  metadata?: Record<string, unknown>;
}

interface UpdateUnitDto {
  name?: string;
  status?: string;
  parent_id?: string | null;
  metadata?: Record<string, unknown>;
}

interface CreatePositionDto {
  organization_id: string;
  org_unit_type_id: string;
  name: string;
  investiture_type?: string;
  mandate_duration_days?: number;
  allows_deputy?: boolean;
}

interface CreateMandateDto {
  organization_id: string;
  position_id: string;
  org_unit_id: string;
  member_id: string;
  start_date: Date;
  end_date?: Date;
}

@Injectable()
export class OrgUnitService {
  constructor(private readonly repo: OrgUnitRepository) {}

  // ─── Types ─────────────────────────────────────────────────────────────────

  async listTypes(organizationId: string) {
    return this.repo.findAllTypes(organizationId);
  }

  async createType(dto: CreateTypeDto, actorId: string) {
    const type = await this.repo.createType(dto);
    await this.audit(dto.organization_id, actorId, 'org_unit_type.created', 'org_unit_type', type.id, null, type);
    return type;
  }

  async updateType(id: string, organizationId: string, data: Partial<CreateTypeDto>, actorId: string) {
    const type = await this.repo.findTypeById(id, organizationId);
    if (!type) throw new NotFoundException('Tipo de unidade não encontrado');
    await this.repo.updateType(id, data as any);
    await this.audit(type.organization_id, actorId, 'org_unit_type.updated', 'org_unit_type', id, type, data);
    return this.repo.findTypeById(id, organizationId);
  }

  async deleteType(id: string, organizationId: string, actorId: string) {
    const type = await this.repo.findTypeById(id, organizationId);
    if (!type) throw new NotFoundException('Tipo de unidade não encontrado');
    await this.repo.deleteType(id);
    await this.audit(type.organization_id, actorId, 'org_unit_type.deleted', 'org_unit_type', id, type, null);
  }

  // ─── Units ─────────────────────────────────────────────────────────────────

  async getTree(organizationId: string) {
    return this.repo.findTree(organizationId);
  }

  async listAll(organizationId: string) {
    return this.repo.findAll(organizationId);
  }

  async findById(id: string, organizationId: string) {
    const unit = await this.repo.findById(id, organizationId);
    if (!unit) throw new NotFoundException('Unidade organizacional não encontrada');
    return unit;
  }

  async create(dto: CreateUnitDto, actorId: string) {
    const slug = dto.slug ?? dto.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const existing = await this.repo.findBySlug(dto.organization_id, slug);
    if (existing) throw new ConflictException(`Slug '${slug}' já está em uso nesta organização`);

    if (!(await this.repo.findTypeById(dto.type_id, dto.organization_id))) {
      throw new BadRequestException('Tipo de unidade não encontrado nesta organização');
    }
    if (dto.parent_id && !(await this.repo.findById(dto.parent_id, dto.organization_id))) {
      throw new BadRequestException('Unidade superior não encontrada nesta organização');
    }
    const unit = await this.repo.createUnit({ ...dto, slug });
    await this.audit(dto.organization_id, actorId, 'org_unit.created', 'org_unit', unit.id, null, unit);
    return unit;
  }

  async update(id: string, organizationId: string, dto: UpdateUnitDto, actorId: string) {
    const unit = await this.findById(id, organizationId);
    if (dto.name !== undefined && (!dto.name.trim() || dto.name.length > 255)) {
      throw new BadRequestException('Informe um nome válido para a unidade.');
    }
    if (dto.status !== undefined && !Object.values(OrgUnitStatus).some((status) => status === dto.status)) {
      throw new BadRequestException('Status de unidade inválido.');
    }
    const updated = await AppDataBase.transaction(async (manager) => {
      await manager.query(`SELECT id FROM organizations WHERE id = $1 FOR UPDATE`, [organizationId]);
      const repository = manager.getRepository(OrgUnit);
      const visited = new Set([id]);
      let parentId = dto.parent_id;
      while (parentId) {
        if (visited.has(parentId)) throw new BadRequestException('A unidade superior não pode criar um ciclo na hierarquia.');
        visited.add(parentId);
        const parent = await repository.findOneBy({ id: parentId, organization_id: organizationId });
        if (!parent) throw new BadRequestException('Unidade superior não encontrada nesta organização.');
        parentId = parent.parent_id;
      }
      const current = await repository.findOneBy({ id, organization_id: organizationId });
      if (!current) throw new NotFoundException('Unidade organizacional não encontrada.');
      if (dto.name !== undefined) current.name = dto.name.trim();
      if (dto.parent_id !== undefined) current.parent_id = dto.parent_id;
      if (dto.metadata !== undefined) current.metadata = dto.metadata;
      if (dto.status !== undefined) current.status = dto.status as OrgUnitStatus;
      return repository.save(current);
    });
    await this.audit(unit.organization_id, actorId, 'org_unit.updated', 'org_unit', id, unit, dto);
    return updated;
  }

  async remove(id: string, organizationId: string, actorId: string) {
    const unit = await this.findById(id, organizationId);
    await this.repo.softDeleteUnit(id);
    await this.audit(unit.organization_id, actorId, 'org_unit.deleted', 'org_unit', id, unit, null);
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  async listPositions(organizationId: string) {
    return this.repo.findAllPositions(organizationId);
  }

  async findPositionById(id: string, organizationId: string) {
    const pos = await this.repo.findPositionById(id, organizationId);
    if (!pos) throw new NotFoundException('Cargo não encontrado');
    return pos;
  }

  async createPosition(dto: CreatePositionDto, actorId: string) {
    this.validatePosition(dto);
    if (!(await this.repo.findTypeById(dto.org_unit_type_id, dto.organization_id))) {
      throw new BadRequestException('Tipo de unidade não encontrado nesta organização');
    }
    const position = await this.repo.createPosition(dto as any);
    await this.audit(dto.organization_id, actorId, 'position.created', 'position', position.id, null, position);
    return position;
  }

  async updatePosition(id: string, organizationId: string, dto: Partial<CreatePositionDto>, actorId: string) {
    this.validatePosition(dto);
    const before = await this.findPositionById(id, organizationId);
    if (
      dto.org_unit_type_id &&
      !(await this.repo.findTypeById(dto.org_unit_type_id, organizationId))
    ) {
      throw new BadRequestException('Tipo de unidade não encontrado nesta organização');
    }
    const updated = await this.repo.updatePosition(id, organizationId, dto as any);
    await this.audit(before.organization_id, actorId, 'position.updated', 'position', id, before, dto);
    return updated;
  }

  async removePosition(id: string, organizationId: string, actorId: string) {
    const pos = await this.findPositionById(id, organizationId);
    await this.repo.softDeletePosition(id);
    await this.audit(pos.organization_id, actorId, 'position.deleted', 'position', id, pos, null);
  }

  // ─── Mandates ──────────────────────────────────────────────────────────────

  async listMandates(organizationId: string) {
    return this.repo.findMandates(organizationId);
  }

  async listMandatesByUnit(unitId: string, organizationId: string) {
    await this.findById(unitId, organizationId);
    return this.repo.findMandatesByUnit(unitId, organizationId);
  }

  async getActiveMandatesForMember(memberId: string, organizationId: string) {
    return this.repo.findActiveMandatesByMember(memberId, organizationId);
  }

  async createMandate(dto: CreateMandateDto, actorId: string) {
    if (!Number.isFinite(dto.start_date.getTime()) ||
        (dto.end_date && (!Number.isFinite(dto.end_date.getTime()) || dto.end_date < dto.start_date))) {
      throw new BadRequestException('Informe datas válidas; o fim não pode ser anterior ao início.');
    }
    const [position, unit, member] = await Promise.all([
      this.repo.findPositionById(dto.position_id, dto.organization_id),
      this.repo.findById(dto.org_unit_id, dto.organization_id),
      AppDataBase.getRepository(Member).findOneBy({
        id: dto.member_id,
        organization_id: dto.organization_id,
      }),
    ]);
    if (!position || !unit) {
      throw new BadRequestException('Cargo ou unidade não encontrado nesta organização');
    }
    if (!member) throw new BadRequestException('Membro não encontrado nesta organização');
    if (position.org_unit_type_id !== unit.type_id) {
      throw new BadRequestException('O cargo deve pertencer ao tipo da unidade selecionada.');
    }
    let endDate = dto.end_date;
    if (!endDate && position.mandate_duration_days) {
      endDate = new Date(dto.start_date);
      endDate.setUTCDate(endDate.getUTCDate() + position.mandate_duration_days);
    }
    const mandate = await this.repo.createMandate({ ...dto, end_date: endDate });
    await this.audit(dto.organization_id, actorId, 'mandate.created', 'mandate', mandate.id, null, mandate);
    return mandate;
  }

  async closeMandate(id: string, organizationId: string, actorId: string, revoked = false) {
    const mandate = await this.repo.findMandateById(id, organizationId);
    if (!mandate) throw new NotFoundException('Mandato não encontrado');
    if (mandate.status !== MandateStatus.ACTIVE) {
      throw new BadRequestException('Mandato já está encerrado');
    }
    const status = revoked ? MandateStatus.REVOKED : MandateStatus.CLOSED;
    const updated = await this.repo.closeMandate(id, organizationId, status);
    await this.audit(mandate.organization_id, actorId, 'mandate.closed', 'mandate', id, mandate, { status });
    return updated;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private validatePosition(dto: Partial<CreatePositionDto>) {
    if (dto.name !== undefined && (!dto.name.trim() || dto.name.length > 100)) {
      throw new BadRequestException('Informe um nome válido para o cargo.');
    }
    if (dto.investiture_type !== undefined &&
        !Object.values(InvestitureType).some((type) => type === dto.investiture_type)) {
      throw new BadRequestException('Forma de investidura inválida.');
    }
    if (dto.mandate_duration_days !== undefined &&
        (!Number.isInteger(dto.mandate_duration_days) || dto.mandate_duration_days < 1 || dto.mandate_duration_days > 36500)) {
      throw new BadRequestException('A duração do mandato deve ser um número inteiro entre 1 e 36500 dias.');
    }
  }

  private async audit(
    orgId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    before: unknown,
    after: unknown,
  ) {
    const repo = AppDataBase.getRepository(AuditLog);
    const actor = await AppDataBase.getRepository(Member).findOne({
      where: { id: actorId },
      select: { id: true, account_id: true },
    });
    await repo.save(
      repo.create({
        organization_id: orgId,
        actor_id: actor?.id ?? null,
        actor_account_id: actor?.account_id ?? actorId,
        actor_type: actor ? 'ORGANIZATION_ADMIN' : 'SUPER_ADMIN',
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_state: before as any,
        after_state: after as any,
      }),
    );
  }
}
