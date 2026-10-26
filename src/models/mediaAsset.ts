import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum MediaAssetStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PENDING_DELETION = 'PENDING_DELETION',
}

export enum MediaAssetVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

@Entity('media_assets')
@Index('media_assets_org_status_idx', ['organization_id', 'status'])
@Index('media_assets_key_idx', ['key'], { unique: true })
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  organization_id!: string;

  @Column({ type: 'text' })
  key!: string;

  @Column({ type: 'varchar', length: 100 })
  mime_type!: string;

  @Column({ type: 'bigint' })
  size_bytes!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string;

  @Column({ type: 'varchar', length: 10, default: MediaAssetVisibility.PRIVATE })
  visibility!: MediaAssetVisibility;

  @Column({ type: 'uuid' })
  uploaded_by?: string | null;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by_account_id?: string | null;

  @Column({ type: 'varchar', length: 30, default: MediaAssetStatus.PENDING })
  status!: MediaAssetStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
