import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Role } from "./role";
import { City } from "./city";
import { Car } from "./car";
import { MemberCourse } from "./memberCourse";

@Entity("members")
export class Member {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 14, unique: true, select: false })
  cpf!: string;

  @Column({ length: 100, select: false })
  password!: string;

  @Column({ length: 20 })
  phone!: string;

  @Column({ length: 255, unique: true })
  email_personal!: string;

  @Column({ length: 255, unique: true })
  email_university!: string;

  @Column({ length: 10, unique: true })
  ra!: string;

  @Column({ type: "text", nullable: true })
  profile_picture_url?: string;

  @Column({ type: "date" })
  birth_date!: Date;

  @OneToMany(() => MemberCourse, (mc) => mc.member)
  memberCourses?: MemberCourse[];

  @Column({ type: "uuid", nullable: true })
  city_id?: string;

  @ManyToOne(() => City, (city) => city.members)
  @JoinColumn({ name: "city_id" })
  city?: City;

  @Column({ type: "date" })
  admission_date!: Date;

  @Column({ type: "uuid", nullable: true })
  sponsor?: string;

  @ManyToMany(() => Role, (role) => role.members)
  @JoinTable({
    name: "member_roles",
    joinColumn: { name: "member_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
  })
  roles: Role[];

  @ManyToMany(() => Car, (car) => car.managers)
  managedCars: Car[];

  @Column({ length: 255, nullable: true })
  biography!: string;

  @Column({ length: 255, nullable: true })
  banner_url!: string;

  @Column({ length: 255, nullable: true })
  curriculum_url!: string;

  @Column({ length: 255, nullable: true })
  youtube_url!: string;

  @Column({ length: 255, nullable: true })
  twitter_url!: string;

  @Column({ length: 255, nullable: true })
  instagram_url!: string;

  @Column({ length: 255, nullable: true })
  linkedin_url!: string;

  @Column({ length: 255, nullable: true })
  github_url!: string;

  @Column({ length: 255, nullable: true })
  slug: string;

  @Column({
  type: "varchar",
  length: 20,
  default: "PENDING"
  })
  status!: string;
}
