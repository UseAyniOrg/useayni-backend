import { Injectable } from '@nestjs/common';
import { AppDataBase } from "../db";
import { Member } from "../models/member";

@Injectable()
export class MemberRepository {
  private repository = AppDataBase.getRepository(Member);

  async findAll() {
    return this.repository.find();
  }

  async findById(id: string) {
    return this.repository.findOneBy({ id });
  }

  async findByEmail(email: string) {
    return this.repository.findOneBy({ email_personal: email });
  }

  async findByEmailWithPassword(email: string) {
    return this.repository
      .createQueryBuilder('member')
      .addSelect('member.password')
      .leftJoinAndSelect('member.roles', 'roles')
      .where('member.email_personal = :email', { email })
      .getOne();
  }

  async findBySponsor(sponsorId: string) {
    return this.repository.findBy({ sponsor: sponsorId });
  }

  async findByName(name: string) {
    return this.repository.findOne({ where: { name } });
  }

  async existsByEmailOrCpfOrRa(email_personal: string, email_university: string, cpf: string, ra: string) {
    return this.repository.findOne({
      where: [
        { email_personal },
        { email_university },
        { cpf },
        { ra },
      ],
    });
  }

  async create(memberData: Partial<Member>) {
    const member = this.repository.create(memberData);
    return this.repository.save(member);
  }

  async update(id: string, updateData: Partial<Member>) {
    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async findByIdWithRolesAndPermissions(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: ["roles", "roles.permissions"],
    });
  }

  async findByIdWithRelations(id: string) {
    return this.repository.findOne({
      where: { id },
      relations: [
        "city",
        "roles",
        "memberCourses",
        "memberCourses.courseUniversity",
        "memberCourses.courseUniversity.course",
        "memberCourses.courseUniversity.university",
      ],
    });
  }

  async findByIdWithPositions(id: string) {
    const member = await this.repository.findOne({
      where: { id },
      relations: [
        "roles",
        "memberCourses",
        "memberCourses.courseUniversity",
        "memberCourses.courseUniversity.course",
        "memberCourses.courseUniversity.university",
        "memberCourses.courseUniversity.city",
      ],
    });

    if (!member) return null;

    // Buscar posições do membro
    const [courseManagers, carManagers, caeManagers, semesterHeads] = await Promise.all([
      this.repository.manager.query(
        `SELECT cm.*, cu.id as course_university_id, c.name as course_name, u.name as university_name, ci.name as city_name
         FROM course_managers cm
         JOIN course_universities cu ON cm.course_university_id = cu.id
         JOIN courses c ON cu.course_id = c.id
         JOIN universities u ON cu.university_id = u.id
         JOIN cities ci ON cu.city_id = ci.id
         WHERE cm.member_id = $1 AND cm.end_date IS NULL AND cm.deleted_at IS NULL`,
        [id]
      ),
      this.repository.manager.query(
        `SELECT cm.*, ca.id as car_id, ca.name as car_name
         FROM car_managers cm
         JOIN cars ca ON cm.car_id = ca.id
         WHERE cm.member_id = $1`,
        [id]
      ),
      this.repository.manager.query(
        `SELECT cm.*, cae.id as cae_id, cae.name as cae_name, s.name as state_name
         FROM cae_managers cm
         JOIN caes cae ON cm.cae_id = cae.id
         JOIN states s ON cae.state_id = s.id
         WHERE cm.member_id = $1 AND cm.end_date IS NULL AND cm.deleted_at IS NULL`,
        [id]
      ),
      this.repository.manager.query(
        `SELECT psh.*, ps.semester_number, c.name as course_name
         FROM program_semester_heads psh
         JOIN program_semesters ps ON psh.program_semester_id = ps.id
         JOIN courses c ON ps.course_id = c.id
         WHERE psh.member_id = $1 AND psh.end_date IS NULL AND psh.deleted_at IS NULL`,
        [id]
      ),
    ]);

    return {
      ...member,
      positions: {
        courseManagers,
        carManagers,
        caeManagers,
        semesterHeads,
      },
    };
  }

  async addCourseToMember(
    memberId: string,
    courseUniversityId: string,
    startedAt?: Date,
  ) {
    const dateStr =
      (startedAt || new Date()).toISOString().split("T")[0];
    await this.repository.manager.query(
      `INSERT INTO member_courses (member_id, course_university_id, status, started_at)
       VALUES ($1, $2, 'active', $3)
       ON CONFLICT (member_id, course_university_id) DO NOTHING`,
      [memberId, courseUniversityId, dateStr],
    );
  }

  async findByNameSlug(slug: string) {
    return this.repository.findOne({
      where: { slug: slug },
      relations: [
        "city",
        "roles",
        "memberCourses",
        "memberCourses.courseUniversity",
        "memberCourses.courseUniversity.course",
        "memberCourses.courseUniversity.university",
      ],
    });
  }
}
