import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Miscellaneous } from './miscellaneous';
import { Member } from './member';

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

@Entity('miscellaneous_invites')
export class MiscellaneousInvite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @Column({ type: 'uuid' })
  invited_by_user_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'invited_by_user_id' })
  invitedBy!: Member;

  @Column({ type: 'uuid' })
  invited_user_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'invited_user_id' })
  invitedUser!: Member;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'varchar', length: 20, default: InviteStatus.PENDING })
  status!: InviteStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  responded_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
