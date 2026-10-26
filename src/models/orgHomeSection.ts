import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OrgHomeSectionType } from '../config/orgHomeSections';

@Entity('organization_home_sections')
@Index('organization_home_sections_org_order_idx', ['organization_id', 'order_index'])
@Index('organization_home_sections_org_type_idx', ['organization_id', 'type'])
export class OrgHomeSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @Column({ type: 'varchar', length: 40 })
  type!: OrgHomeSectionType;

  @Column({ type: 'int' })
  order_index!: number;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ type: 'varchar', length: 255, default: '' })
  title!: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  subtitle!: string;

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
