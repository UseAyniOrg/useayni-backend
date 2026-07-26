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
import { Member } from './member';

/** One rule in the scope_rules array (OR-combined) */
export interface ScopeRule {
  type: 'general' | 'cae' | 'car' | 'city' | 'university' | 'course' | 'semester';
  cae_id?: string;
  car_id?: string;
  city_id?: string;
  university_id?: string; // null = any university
  course_id?: string; // null = any course of the university
  semester?: number; // null = any semester of the course
}

export enum MiscellaneousType {
  PROJECT = 'project',
  EVENT = 'event',
  GOAL = 'goal',
  MEETING = 'meeting',
  ACTIVITY = 'activity',
  FORM = 'form',
}

export enum MiscellaneousStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  UNDER_REVIEW = 'under_review',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum MiscellaneousParticipation {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

// kept for backward compat
export const MiscellaneousVisibility = MiscellaneousParticipation;

export enum MiscellaneousScope {
  INDIVIDUAL = 'individual',
  SEMESTER = 'semester',
  COURSE = 'course',
  UNIVERSITY = 'university',
  CITY = 'city',
  CAR = 'car',
  CAE = 'cae',
  GENERAL = 'general',
}

export enum ActivityStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  BLOCKED = 'blocked',
}

export enum ActivityPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('miscellaneous')
export class Miscellaneous {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: MiscellaneousType;

  @Column({ type: 'varchar', length: 30, default: MiscellaneousStatus.DRAFT })
  status!: MiscellaneousStatus;

  /** participation_type: 'public' = free join, 'private' = request-based */
  @Column({ type: 'varchar', length: 20, default: 'public' })
  participation_type!: string;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  visibility!: string;

  /**
   * scope_rules: array of rule objects describing who can see this.
   * Each rule is OR-combined.
   * Rule shape: { type: 'general'|'cae'|'car'|'university'|'course'|'semester', ids: {...} }
   */
  @Column({ type: 'jsonb', nullable: true })
  scope_rules?: ScopeRule[];

  @Column({ type: 'int', nullable: true })
  max_participants?: number;

  // kept for legacy listing queries
  @Column({ type: 'varchar', length: 20, nullable: true })
  scope?: MiscellaneousScope;

  @Column({ type: 'timestamptz' })
  start_date!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date?: Date;

  // Location
  @Column({ type: 'varchar', length: 10, nullable: true })
  location_zip?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location_street?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  location_number?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location_neighborhood?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location_city?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  location_state?: string;

  // Media
  @Column({ type: 'text', nullable: true })
  cover_url?: string;

  @Column({ type: 'text', nullable: true })
  banner_url?: string;

  // Public access
  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  public_slug?: string;

  @Column({ type: 'boolean', default: false })
  public_access_enabled!: boolean;

  // Type-specific: Event
  @Column({ type: 'text', nullable: true })
  stream_link?: string;

  @Column({ type: 'int', nullable: true })
  capacity_presential?: number;

  @Column({ type: 'int', nullable: true })
  capacity_online?: number;

  // Type-specific: Meeting
  @Column({ type: 'text', nullable: true })
  meeting_link?: string;

  @Column({ type: 'text', nullable: true })
  agenda?: string;

  // Type-specific: Goal
  @Column({ type: 'numeric', nullable: true })
  goal_target?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  goal_unit?: string;

  @Column({ type: 'numeric', nullable: true })
  goal_progress?: number;

  // Type-specific: Activity
  @Column({ type: 'varchar', length: 20, nullable: true })
  activity_status?: ActivityStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  activity_priority?: ActivityPriority;

  // Registration
  @Column({ type: 'timestamptz', nullable: true })
  registration_start_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  registration_end_date?: Date;

  @Column({ type: 'int', nullable: true })
  max_members?: number;

  @Column({ type: 'boolean', default: false })
  waitlist_enabled!: boolean;

  @Column({ type: 'text', nullable: true })
  waitlist_message?: string;

  // Hierarchy
  @Column({ type: 'uuid', nullable: true })
  parent_id?: string;

  @ManyToOne(() => Miscellaneous, m => m.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Miscellaneous;

  @OneToMany(() => Miscellaneous, m => m.parent)
  children?: Miscellaneous[];

  // Creator
  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'created_by' })
  creator!: Member;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;
}
