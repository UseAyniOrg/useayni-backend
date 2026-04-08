import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { CourseUniversity } from "./courseUniversity";
import { Member } from "./member";

@Entity("course_managers")
export class CourseManager {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  course_university_id!: string;

  @ManyToOne(() => CourseUniversity)
  @JoinColumn({ name: "course_university_id" })
  courseUniversity!: CourseUniversity;

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
