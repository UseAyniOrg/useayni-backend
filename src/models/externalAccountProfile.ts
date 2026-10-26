import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from './globalUserAccount';

export type ExternalProfileType = 'basic' | 'academic';

@Entity('external_account_profiles')
export class ExternalAccountProfile {
  @PrimaryColumn({ type: 'uuid' })
  account_id!: string;

  @OneToOne(() => UserAccount)
  @JoinColumn({ name: 'account_id' })
  account!: UserAccount;

  @Column({ type: 'varchar', length: 255 })
  display_name!: string;

  @Column({ type: 'varchar', length: 20, default: 'basic' })
  profile_type!: ExternalProfileType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'jsonb', default: {} })
  academic_data!: Record<string, unknown>;

  @Column({ type: 'jsonb', default: {} })
  additional_attributes!: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
