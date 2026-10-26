import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { OrgUnit } from '../models/orgUnit';
import { OrgUnitType } from '../models/orgUnitType';
import { Position } from '../models/position';
import { Mandate, MandateStatus } from '../models/mandate';

@Injectable()
export class OrgUnitRepository {
  private get unitRepo() { return AppDataBase.getRepository(OrgUnit); }
  private get typeRepo() { return AppDataBase.getRepository(OrgUnitType); }
  private get positionRepo() { return AppDataBase.getRepository(Position); }
  private get mandateRepo() { return AppDataBase.getRepository(Mandate); }

  // ─── Types ─────────────────────────────────────────────────────────────────

  findAllTypes(organization_id: string) {
    return this.typeRepo.find({
      where: { organization_id },
      order: { name: 'ASC' },
    });
  }

  findTypeById(id: string, organization_id: string) {
    return this.typeRepo.findOneBy({ id, organization_id });
  }

  createType(data: Partial<OrgUnitType>) {
    return this.typeRepo.save(this.typeRepo.create({
      id: data.id,
      organization_id: data.organization_id,
      slug: data.slug,
      name: data.name,
      metadata_schema: data.metadata_schema,
    }));
  }

  updateType(id: string, data: Partial<OrgUnitType>) {
    return this.typeRepo.findOneBy({ id }).then((type) => {
      if (!type) return null;
      Object.assign(type, {
        slug: data.slug,
        name: data.name,
        metadata_schema: data.metadata_schema,
      });
      return this.typeRepo.save(type);
    });
  }

  deleteType(id: string) {
    return this.typeRepo.delete(id);
  }

  // ─── Units ─────────────────────────────────────────────────────────────────

  findAll(organization_id: string) {
    return this.unitRepo.find({
      where: { organization_id },
      relations: ['type', 'parent'],
      order: { name: 'ASC' },
    });
  }

  findById(id: string, organization_id: string) {
    return this.unitRepo.findOne({
      where: { id, organization_id },
      relations: ['type', 'parent', 'children', 'children.type'],
    });
  }

  findBySlug(organization_id: string, slug: string) {
    return this.unitRepo.findOne({ where: { organization_id, slug } });
  }

  findRoots(organization_id: string) {
    return this.unitRepo.find({
      where: { organization_id, parent_id: undefined },
      relations: ['type'],
    });
  }

  async findTree(organization_id: string): Promise<OrgUnit[]> {
    // Load all units and build in-memory tree
    const all = await this.unitRepo.find({
      where: { organization_id },
      relations: ['type'],
      order: { name: 'ASC' },
    });

    const map = new Map<string, OrgUnit & { children: OrgUnit[] }>();
    all.forEach((u) => map.set(u.id, { ...u, children: [] }));

    const roots: (OrgUnit & { children: OrgUnit[] })[] = [];
    map.forEach((unit) => {
      if (unit.parent_id && map.has(unit.parent_id)) {
        map.get(unit.parent_id)!.children.push(unit);
      } else {
        roots.push(unit);
      }
    });

    return roots;
  }

  createUnit(data: Partial<OrgUnit>) {
    return this.unitRepo.save(this.unitRepo.create({
      id: data.id,
      organization_id: data.organization_id,
      parent_id: data.parent_id,
      type_id: data.type_id,
      name: data.name,
      slug: data.slug,
      metadata: data.metadata,
      status: data.status,
    }));
  }

  async updateUnit(id: string, organization_id: string, data: Partial<OrgUnit>) {
    const unit = await this.unitRepo.findOneBy({ id, organization_id });
    if (!unit) return null;
    Object.assign(unit, {
      parent_id: data.parent_id,
      type_id: data.type_id,
      name: data.name,
      slug: data.slug,
      metadata: data.metadata,
      status: data.status,
    });
    await this.unitRepo.save(unit);
    return this.findById(id, organization_id);
  }

  softDeleteUnit(id: string) {
    return this.unitRepo.softDelete(id);
  }

  // ─── Positions ─────────────────────────────────────────────────────────────

  findAllPositions(organization_id: string) {
    return this.positionRepo.find({
      where: { organization_id },
      relations: ['org_unit_type', 'roles'],
      order: { name: 'ASC' },
    });
  }

  findPositionById(id: string, organization_id: string) {
    return this.positionRepo.findOne({
      where: { id, organization_id },
      relations: ['org_unit_type', 'roles'],
    });
  }

  createPosition(data: Partial<Position>) {
    return this.positionRepo.save(this.positionRepo.create({
      id: data.id,
      organization_id: data.organization_id,
      org_unit_type_id: data.org_unit_type_id,
      name: data.name,
      investiture_type: data.investiture_type,
      mandate_duration_days: data.mandate_duration_days,
      allows_deputy: data.allows_deputy,
      roles: data.roles,
    }));
  }

  async updatePosition(id: string, organization_id: string, data: Partial<Position>) {
    const position = await this.positionRepo.findOneBy({ id, organization_id });
    if (!position) return null;
    Object.assign(position, {
      org_unit_type_id: data.org_unit_type_id,
      name: data.name,
      investiture_type: data.investiture_type,
      mandate_duration_days: data.mandate_duration_days,
      allows_deputy: data.allows_deputy,
    });
    await this.positionRepo.save(position);
    return this.findPositionById(id, organization_id);
  }

  softDeletePosition(id: string) {
    return this.positionRepo.softDelete(id);
  }

  // ─── Mandates ──────────────────────────────────────────────────────────────

  findMandates(organization_id: string) {
    return this.mandateRepo.find({
      where: { organization_id },
      relations: ['position', 'org_unit', 'member'],
      order: { start_date: 'DESC' },
    });
  }

  findActiveMandatesByMember(member_id: string, organization_id: string) {
    return this.mandateRepo.find({
      where: { member_id, organization_id, status: MandateStatus.ACTIVE },
      relations: ['position', 'org_unit', 'org_unit.type'],
    });
  }

  findMandatesByUnit(org_unit_id: string, organization_id: string) {
    return this.mandateRepo.find({
      where: { org_unit_id, organization_id },
      relations: ['position', 'member'],
      order: { start_date: 'DESC' },
    });
  }

  findMandateById(id: string, organization_id: string) {
    return this.mandateRepo.findOne({
      where: { id, organization_id },
      relations: ['position', 'org_unit', 'member'],
    });
  }

  createMandate(data: Partial<Mandate>) {
    return this.mandateRepo.save(this.mandateRepo.create(data));
  }

  async closeMandate(id: string, organization_id: string, status: MandateStatus = MandateStatus.CLOSED) {
    await this.mandateRepo.update({ id, organization_id }, {
      status,
      end_date: new Date() as unknown as Date,
    });
    return this.findMandateById(id, organization_id);
  }
}
