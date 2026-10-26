import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization';
import { Position } from './position';
import { OrgUnit } from './orgUnit';
import { Member } from './member';

export enum MandateStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  REVOKED = 'REVOKED',
}

@Entity('mandates')
export class Mandate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  position_id!: string;

  @ManyToOne(() => Position)
  @JoinColumn({ name: 'position_id' })
  position!: Position;

  @Column({ type: 'uuid' })
  org_unit_id!: string;

  @ManyToOne(() => OrgUnit)
  @JoinColumn({ name: 'org_unit_id' })
  org_unit!: OrgUnit;

  @Column({ type: 'uuid' })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'date' })
  start_date!: Date;

  @Column({ type: 'date', nullable: true })
  end_date?: Date;

  @Column({ type: 'varchar', length: 20, default: MandateStatus.ACTIVE })
  status!: MandateStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
