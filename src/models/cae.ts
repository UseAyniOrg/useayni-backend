import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { State } from "./state";
import { CaeManager } from "./caeManager";
import { Car } from "./car";

@Entity("caes")
export class Cae {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "uuid" })
  state_id!: string;

  @ManyToOne(() => State)
  @JoinColumn({ name: "state_id" })
  state!: State;

  @OneToMany(() => CaeManager, (manager) => manager.cae)
  managers!: CaeManager[];

  @OneToMany(() => Car, (car) => car.cae)
  cars!: Car[];

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deleted_at?: Date;
}
