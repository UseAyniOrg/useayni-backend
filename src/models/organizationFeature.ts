import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './organization';

@Entity('organization_features')
export class OrganizationFeature {
  @PrimaryColumn({ type: 'uuid' })
  organization_id!: string;

  @PrimaryColumn({ length: 100 })
  feature_slug!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ default: true })
  enabled!: boolean;

  @Column({ type: 'jsonb', default: {} })
  config!: Record<string, unknown>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
