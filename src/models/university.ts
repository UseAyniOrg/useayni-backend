import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { CourseUniversity } from "./courseUniversity";
import { City } from "./city";

@Entity("universities")
export class University {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  acronym?: string | null;

  @Column({ type: "varchar", length: 30, nullable: true })
  emec_code?: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  source?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  category?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  organization_type?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  status?: string | null;

  @Column({ type: "uuid", nullable: true })
  city_id?: string | null;

  @ManyToOne(() => City, (city) => city.universities)
  @JoinColumn({ name: "city_id" })
  city?: City;

  // direct relationship to courses removed: now accessed through CourseUniversity entity
  @OneToMany(() => CourseUniversity, (cu) => cu.university)
  courseUniversities: CourseUniversity[];
}
