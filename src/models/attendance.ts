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

export enum AttendanceMode {
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
}

@Entity('attendance_sessions')
export class AttendanceSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 20 })
  mode!: AttendanceMode;

  @Column({ type: 'timestamptz' })
  starts_at!: Date;

  @Column({ type: 'timestamptz' })
  ends_at!: Date;

  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'created_by' })
  creator!: Member;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

@Entity('attendance_records')
export class AttendanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  session_id!: string;

  @ManyToOne(() => AttendanceSession)
  @JoinColumn({ name: 'session_id' })
  session!: AttendanceSession;

  @Column({ type: 'uuid' })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'boolean', default: true })
  present!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  checked_in_at?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

@Entity('attendance_tokens')
export class AttendanceToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  session_id!: string;

  @ManyToOne(() => AttendanceSession)
  @JoinColumn({ name: 'session_id' })
  session!: AttendanceSession;

  @Column({ type: 'uuid' })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'member_id' })
  member!: Member;

  @Column({ type: 'varchar', length: 255, unique: true })
  token!: string;

  @Column({ type: 'timestamptz' })
  expires_at!: Date;

  @Column({ type: 'boolean', default: false })
  used!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
