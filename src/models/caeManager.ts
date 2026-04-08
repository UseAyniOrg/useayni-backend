import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Cae } from "./cae";
import { Member } from "./member";

@Entity("cae_managers")
export class CaeManager {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  cae_id!: string;

  @ManyToOne(() => Cae, (cae) => cae.managers)
  @JoinColumn({ name: "cae_id" })
  cae!: Cae;

  @Column({ type: "uuid" })
  member_id!: string;

  @ManyToOne(() => Member)
  @JoinColumn({ name: "member_id" })
  member!: Member;

  @Column({ type: "date", nullable: true })
  start_date?: Date;

  @Column({ type: "date", nullable: true })
  end_date?: Date;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deleted_at?: Date;
}
