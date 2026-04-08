import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, ManyToOne, JoinTable, JoinColumn, CreateDateColumn, DeleteDateColumn } from "typeorm";
import { City } from "./city";
import { Member } from "./member";
import { Cae } from "./cae";

@Entity("cars")
export class Car {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @DeleteDateColumn({ type: "timestamptz" })
  deleted_at?: Date;

  @Column({ type: "uuid", nullable: true })
  cae_id?: string;

  @ManyToOne(() => Cae, (cae) => cae.cars)
  @JoinColumn({ name: "cae_id" })
  cae?: Cae;

  @ManyToMany(() => City, (city) => city.cars)
  @JoinTable({
    name: "car_cities",
    joinColumn: { name: "car_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "city_id", referencedColumnName: "id" },
  })
  cities: City[];

  @ManyToMany(() => Member, (member) => member.managedCars)
  @JoinTable({
    name: "car_managers",
    joinColumn: { name: "car_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "member_id", referencedColumnName: "id" },
  })
  managers: Member[];
}
