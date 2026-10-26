import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Organization } from './organization';
import { Miscellaneous } from './miscellaneous';
import { UserAccount } from './globalUserAccount';
import { Member } from './member';

@Entity('external_event_registrations')
export class ExternalEventRegistration {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @Column({ type: 'uuid' })
  account_id!: string;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'account_id' })
  account!: UserAccount;

  @Column({ type: 'uuid' })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'varchar', length: 20 })
  profile_type!: 'basic' | 'academic';

  @Column({ type: 'jsonb', default: {} })
  shared_profile!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  registration_data!: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  profile_consent_at!: Date;

  @Column({ type: 'varchar', length: 50 })
  profile_consent_version!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
