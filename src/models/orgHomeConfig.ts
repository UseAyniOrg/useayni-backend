import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrgHomeStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface OrgHomeTheme {
  primary_color: string;
  secondary_color: string;
  background_color?: string;
  logo_background_color?: string;
  logo_asset_id?: string | null;
  favicon_asset_id?: string | null;
  font_family?: string;
}

export interface OrgHomeSeo {
  title?: string;
  description?: string;
  og_image_asset_id?: string | null;
}

export interface OrgHomeContact {
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  map_url?: string;
}

@Entity('organization_home_configs')
@Index('organization_home_configs_status_idx', ['status'])
export class OrgHomeConfig {
  @PrimaryColumn({ type: 'uuid' })
  organization_id!: string;

  @Column({ type: 'varchar', length: 20, default: OrgHomeStatus.DRAFT })
  status!: OrgHomeStatus;

  @Column({ type: 'jsonb', default: {} })
  theme!: OrgHomeTheme;

  @Column({ type: 'jsonb', default: {} })
  seo!: OrgHomeSeo;

  @Column({ type: 'jsonb', default: {} })
  social_links!: Record<string, string>;

  @Column({ type: 'jsonb', default: {} })
  contact!: OrgHomeContact;

  @Column({ type: 'timestamptz', nullable: true })
  published_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
