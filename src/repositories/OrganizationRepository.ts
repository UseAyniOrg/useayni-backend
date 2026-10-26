import { Injectable } from '@nestjs/common';
import { AppDataBase } from '../db';
import { Organization } from '../models/organization';
import { OrganizationFeature } from '../models/organizationFeature';
import { Plan } from '../models/plan';

@Injectable()
export class OrganizationRepository {
  private get repo() {
    return AppDataBase.getRepository(Organization);
  }

  private get featureRepo() {
    return AppDataBase.getRepository(OrganizationFeature);
  }

  private get planRepo() {
    return AppDataBase.getRepository(Plan);
  }

  findAll() {
    return this.repo.find({
      where: { deleted_at: undefined },
      relations: ['plan'],
      order: { name: 'ASC' },
    });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ['plan'] });
  }

  findBySlug(slug: string) {
    return this.repo.findOne({ where: { slug }, relations: ['plan'] });
  }

  async create(data: Partial<Organization>) {
    const org = this.repo.create(data);
    return this.repo.save(org);
  }

  async update(id: string, data: Partial<Organization>) {
    const organization = await this.repo.findOneBy({ id });
    if (!organization) return null;
    Object.assign(organization, data);
    return this.repo.save(organization);
  }

  async softDelete(id: string) {
    await this.repo.softDelete(id);
  }

  // ─── Features ─────────────────────────────────────────────────────────────

  findFeatures(organization_id: string) {
    return this.featureRepo.find({ where: { organization_id } });
  }

  findEnabledFeatures(organization_id: string) {
    return this.featureRepo.find({ where: { organization_id, enabled: true } });
  }

  async upsertFeature(
    organization_id: string,
    feature_slug: string,
    enabled: boolean,
    config: Record<string, unknown> = {},
  ) {
    const feature = await this.featureRepo.findOneBy({ organization_id, feature_slug }) ??
      this.featureRepo.create({
      organization_id,
      feature_slug,
    });
    feature.enabled = enabled;
    feature.config = config;
    return this.featureRepo.save(feature);
  }

  // ─── Plans ─────────────────────────────────────────────────────────────────

  findAllPlans() {
    return this.planRepo.find({ where: { is_active: true }, order: { price_brl: 'ASC' } });
  }
}
