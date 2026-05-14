import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, ManyToMany } from "typeorm";
import { State } from "./state";
import { Member } from "./member";
import { Car } from "./car";
import { CourseUniversity } from "./courseUniversity";
import { University } from "./university";

@Entity("cities")
export class City {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 10, nullable: true })
  ibge_code: string;

  @Column({ type: "uuid" })
  state_id: string;

  @ManyToOne(() => State, (state) => state.cities)
  @JoinColumn({ name: "state_id" })
  state: State;

  @OneToMany(() => Member, (member) => member.city)
  members: Member[];

  @ManyToMany(() => Car, (car) => car.cities)
  cars: Car[];

  @OneToMany(() => CourseUniversity, (cu) => cu.city)
  courseUniversities: CourseUniversity[];

  @OneToMany(() => University, (university) => university.city)
  universities: University[];
}
