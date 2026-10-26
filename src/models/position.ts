import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Organization } from './organization';
import { OrgUnitType } from './orgUnitType';
import { Role } from './role';

export enum InvestitureType {
  ELECTION = 'ELECTION',
  APPOINTMENT = 'APPOINTMENT',
  AUTOMATIC = 'AUTOMATIC',
}

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  org_unit_type_id!: string;

  @ManyToOne(() => OrgUnitType)
  @JoinColumn({ name: 'org_unit_type_id' })
  org_unit_type!: OrgUnitType;

  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: InvestitureType.ELECTION,
  })
  investiture_type!: InvestitureType;

  @Column({ type: 'int', nullable: true })
  mandate_duration_days?: number;

  @Column({ default: false })
  allows_deputy!: boolean;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'position_roles',
    joinColumn: { name: 'position_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deleted_at?: Date;
}
