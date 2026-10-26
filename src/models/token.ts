import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Token {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  token!: string;

  @Column({ type: 'uuid', nullable: true })
  memberId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  account_id?: string | null;

  @Column({ type: "varchar", length: 20 })
  type!: "access" | "refresh";

  @Column({ type: "timestamp" })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
