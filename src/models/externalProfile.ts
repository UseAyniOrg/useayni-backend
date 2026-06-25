import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Miscellaneous } from './miscellaneous';

@Entity('external_profiles')
export class ExternalProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  institution?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  course?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  state?: string;

  @Column({ type: 'uuid' })
  miscellaneous_id!: string;

  @ManyToOne(() => Miscellaneous)
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous!: Miscellaneous;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
