import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Member } from './member';
import { Miscellaneous } from './miscellaneous';
import {
  MISC_ENUM_NAMES,
  MiscellaneousMemberStatus,
} from '../helpers/miscellaneous.enums';

/**
 * Membros (iniciais/convidados) de uma miscelânea.
 * RN-003: na seleção individual, cada convite fica como `pendente` aguardando
 * o aceite do convidado.
 */
@Entity('miscellaneous_members')
@Unique(['miscellaneous_id', 'member_id'])
export class MiscellaneousMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  miscellaneous_id: string;

  @ManyToOne(() => Miscellaneous, (m) => m.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous?: Miscellaneous;

  @Column({ type: 'uuid' })
  member_id: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member?: Member;

  @Column({
    type: 'enum',
    enum: MiscellaneousMemberStatus,
    enumName: MISC_ENUM_NAMES.memberStatus,
    default: MiscellaneousMemberStatus.PENDENTE,
  })
  status: MiscellaneousMemberStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
