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

export enum OwnerRole {
  OWNER = 'owner',
  CO_OWNER = 'co_owner',
}

@Entity('miscellaneous_owners')
export class MiscellaneousOwner {
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

  @Column({ type: 'varchar', length: 20, default: OwnerRole.OWNER })
  role!: OwnerRole;

  @Column({ type: 'boolean', default: false })
  is_creator!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
