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

  @OneToMany(() => MemberCourse, (mc) => mc.courseUniversity)
  memberCourses!: MemberCourse[];

}
