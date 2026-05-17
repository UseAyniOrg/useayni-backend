import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Course } from "./course";
import { University } from "./university";
import { City } from "./city";
import { MemberCourse } from "./memberCourse";

@Entity("course_universities")
export class CourseUniversity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  course_id!: string;

  @ManyToOne(() => Course, (course) => course.courseUniversities)
  @JoinColumn({ name: "course_id" })
  course!: Course;

  @Column({ type: "uuid" })
  university_id!: string;

  @ManyToOne(() => University, (univ) => univ.courseUniversities)
  @JoinColumn({ name: "university_id" })
  university!: University;

  @Column({ type: "uuid" })
  city_id!: string;

  @ManyToOne(() => City, (city) => city.courseUniversities)
  @JoinColumn({ name: "city_id" })
  city!: City;

  @Column({ type: "varchar", length: 50, nullable: true })
  external_course_id?: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  source?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  degree_type?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  modality?: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  academic_level?: string | null;

  @OneToMany(() => MemberCourse, (mc) => mc.courseUniversity)
  memberCourses!: MemberCourse[];

}
