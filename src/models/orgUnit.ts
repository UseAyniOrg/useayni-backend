import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Organization } from './organization';
import { OrgUnitType } from './orgUnitType';

export enum OrgUnitStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING_DELETION = 'PENDING_DELETION',
}

@Entity('org_units')
export class OrgUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid', nullable: true })
  parent_id?: string | null;

  @ManyToOne(() => OrgUnit, (u) => u.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: OrgUnit;

  @OneToMany(() => OrgUnit, (u) => u.parent)
  children?: OrgUnit[];

  @Column({ type: 'uuid' })
  type_id!: string;

  @ManyToOne(() => OrgUnitType)
  @JoinColumn({ name: 'type_id' })
  type!: OrgUnitType;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255 })
  slug!: string;

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: OrgUnitStatus.ACTIVE })
  status!: OrgUnitStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;
}
