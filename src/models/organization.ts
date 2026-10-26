import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Plan } from './plan';

export enum OrganizationStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  CANCELLED = 'CANCELLED',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 100, unique: true })
  slug!: string;

  @Column({ type: 'uuid', nullable: true })
  plan_id?: string;

  @ManyToOne(() => Plan, { nullable: true })
  @JoinColumn({ name: 'plan_id' })
  plan?: Plan;

  @Column({
    type: 'varchar',
    length: 20,
    default: OrganizationStatus.ACTIVE,
  })
  status!: OrganizationStatus;

  @Column({ type: 'int', default: 1 })
  onboarding_step!: number;

  @Column({ type: 'text', nullable: true })
  suspension_reason?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  suspended_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  suspended_by_account_id?: string | null;

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  theme!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;
}
