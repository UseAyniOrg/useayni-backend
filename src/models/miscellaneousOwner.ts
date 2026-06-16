import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { Member } from './member';
import { Miscellaneous } from './miscellaneous';

/**
 * Donos (responsáveis) de uma miscelânea.
 * RN-001: o criador é registrado como dono principal (is_primary = true).
 */
@Entity('miscellaneous_owners')
@Unique(['miscellaneous_id', 'member_id'])
export class MiscellaneousOwner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  miscellaneous_id: string;

  @ManyToOne(() => Miscellaneous, (m) => m.owners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous?: Miscellaneous;

  @Column({ type: 'uuid' })
  member_id: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @Column({ type: 'boolean', default: false })
  is_primary: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
