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

export enum ApprovalAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  REQUEST_REVIEW = 'request_review',
}

@Entity('miscellaneous_approval_logs')
export class MiscellaneousApprovalLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @Column({ type: 'uuid' })
  actor_user_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'actor_user_id' })
  actor!: Member;

  @Column({ type: 'varchar', length: 20 })
  action!: ApprovalAction;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
