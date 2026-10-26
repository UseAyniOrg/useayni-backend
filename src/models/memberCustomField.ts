import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Organization } from './organization';
import { Member } from './member';

@Entity('member_custom_field_definitions')
export class MemberCustomFieldDefinition {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ length: 100 })
  field_key!: string;

  @Column({ length: 255 })
  label!: string;

  /** text | number | date | select | checkbox | file */
  @Column({ length: 30, default: 'text' })
  field_type!: string;

  @Column({ default: false })
  required!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  options?: string[] | null;

  @Column({ type: 'int', default: 0 })
  position!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

@Entity('member_custom_field_values')
export class MemberCustomFieldValue {
  @PrimaryColumn({ type: 'uuid' })
  member_id!: string;

  @PrimaryColumn({ length: 100 })
  field_key!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'text', nullable: true })
  value?: string;
}
