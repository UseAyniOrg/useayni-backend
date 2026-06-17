import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Member } from './member';
import { MiscellaneousOwner } from './miscellaneousOwner';
import { MiscellaneousMember } from './miscellaneousMember';
import {
  MISC_ENUM_NAMES,
  MiscellaneousScope,
  MiscellaneousStatus,
  MiscellaneousType,
  MiscellaneousVisibility,
} from '../helpers/miscellaneous.enums';

@Entity('miscellaneous')
export class Miscellaneous {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MiscellaneousType,
    enumName: MISC_ENUM_NAMES.type,
  })
  type: MiscellaneousType;

  // Campos comuns a todos os tipos
  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamptz' })
  start_date: Date;

  @Column({ type: 'timestamptz', nullable: true })
  end_date?: Date | null;

  @Column({
    type: 'enum',
    enum: MiscellaneousVisibility,
    enumName: MISC_ENUM_NAMES.visibility,
  })
  visibility: MiscellaneousVisibility;

  @Column({
    type: 'enum',
    enum: MiscellaneousScope,
    enumName: MISC_ENUM_NAMES.scope,
  })
  scope: MiscellaneousScope;

  @Column({
    type: 'enum',
    enum: MiscellaneousStatus,
    enumName: MISC_ENUM_NAMES.status,
  })
  status: MiscellaneousStatus;

  // Local (opcional)
  @Column({ type: 'varchar', length: 9, nullable: true })
  cep?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bairro?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rua?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cidade?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  estado?: string | null;

  // Mídia (opcional)
  @Column({ type: 'text', nullable: true })
  cover_photo_url?: string | null;

  @Column({ type: 'text', nullable: true })
  banner_url?: string | null;

  // Vínculo de aninhamento (opcional)
  @Column({ type: 'uuid', nullable: true })
  parent_id?: string | null;

  @ManyToOne(() => Miscellaneous, (m) => m.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Miscellaneous | null;

  @OneToMany(() => Miscellaneous, (m) => m.parent)
  children?: Miscellaneous[];

  // Criador (RN-001 — vira dono principal)
  @Column({ type: 'uuid' })
  creator_id: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: 'creator_id' })
  creator?: Member;

  @OneToMany(() => MiscellaneousOwner, (o) => o.miscellaneous)
  owners?: MiscellaneousOwner[];

  @OneToMany(() => MiscellaneousMember, (mm) => mm.miscellaneous)
  members?: MiscellaneousMember[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;
}
