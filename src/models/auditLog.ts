import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from './organization';
import { Member } from './member';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid', nullable: true })
  actor_id?: string | null;

  @Column({ type: 'uuid', nullable: true })
  actor_account_id?: string;

  @Column({ type: 'uuid', nullable: true })
  support_session_id?: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  actor_type?: string;

  @ManyToOne(() => Member, { nullable: true })
  @JoinColumn({ name: 'actor_id' })
  actor?: Member;

  @Column({ length: 100 })
  action!: string;

  @Column({ length: 50 })
  entity_type!: string;

  @Column({ type: 'uuid' })
  entity_id!: string;

  @Column({ type: 'jsonb', nullable: true })
  before_state?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  after_state?: Record<string, unknown>;

  @Column({ length: 45, nullable: true })
  ip_address?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
