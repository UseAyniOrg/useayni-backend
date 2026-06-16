import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Member } from './member';
import { Miscellaneous } from './miscellaneous';

export enum MiscellaneousNotificationType {
  /** Enviada ao gestor do nível quando a criação requer aprovação (RN-002). */
  APROVACAO = 'aprovacao',
  /** Enviada ao membro convidado na seleção individual (RN-003). */
  CONVITE = 'convite',
  /** Enviada ao criador confirmando a criação / informando pendência. */
  CONFIRMACAO = 'confirmacao',
}

/**
 * Registro de notificações disparadas pelo fluxo de criação de miscelânea.
 * Mantido escopado à feature para não acoplar a um sistema de notificações
 * global ainda inexistente.
 */
@Entity('miscellaneous_notifications')
export class MiscellaneousNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  recipient_id: string;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient?: Member;

  @Column({ type: 'uuid', nullable: true })
  miscellaneous_id?: string | null;

  @ManyToOne(() => Miscellaneous, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'miscellaneous_id' })
  miscellaneous?: Miscellaneous | null;

  @Column({
    type: 'enum',
    enum: MiscellaneousNotificationType,
    enumName: 'enum_miscellaneous_notification_type',
  })
  type: MiscellaneousNotificationType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
