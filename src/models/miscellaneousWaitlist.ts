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

export enum WaitlistStatus {
  WAITING = 'waiting',
  PROMOTED = 'promoted',
  REMOVED = 'removed',
}

@Entity('miscellaneous_waitlist')
export class MiscellaneousWaitlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @Column({ type: 'uuid' })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'int' })
  position!: number;

  @Column({ type: 'varchar', length: 20, default: WaitlistStatus.WAITING })
  status!: WaitlistStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
