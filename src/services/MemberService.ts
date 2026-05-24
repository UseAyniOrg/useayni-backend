import { ForbiddenException, Injectable } from "@nestjs/common";
import bcrypt from "bcryptjs";
import { MemberRepository } from "../repositories/MemberRepository";
import { TokenRepository } from "../repositories/TokenRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { CourseManagerRepository } from "../repositories/CourseManagerRepository";
import { CaeManagerRepository } from "../repositories/CaeManagerRepository";
import { StateRepository } from "../repositories/StateRepository";
import { CityRepository } from "../repositories/CityRepository";
import { UniversityRepository } from "../repositories/UniversityRepository";
import { CourseRepository } from "../repositories/CourseRepository";
import { CourseUniversityRepository } from "../repositories/CourseUniversityRepository";
import { Member, MemberRegistrationStatus } from "../models/member";
import { MemberProfileDto } from "../dto/members/member-profile.dto";
import { AppDataBase } from "../db";
import { CreateMemberDto } from "../dto/members/create-member.dto";

@Injectable()
export class MemberService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly stateRepository: StateRepository,
    private readonly cityRepository: CityRepository,
    private readonly universityRepository: UniversityRepository,
    private readonly courseRepository: CourseRepository,
    private readonly courseUniversityRepository: CourseUniversityRepository,
  ) {}

  async getMembersForApproval(reviewerId: string) {
  const reviewer =
    await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);

  if (!reviewer) throw new Error("Reviewer not found");

  const pendingMembers =
    await this.memberRepository.findByRegistrationStatus(
      MemberRegistrationStatus.PENDING,
    );

  const result: Member[] = [];

  for (const member of pendingMembers) {
    const canAccess = await this.canReviewerAccessMember(
      reviewerId,
      member,
    );

    if (canAccess) {
      result.push(member);
    }
  }

  return result;
  }
  async getAllMembers() {
    return this.memberRepository.findAll();
  }

  async getSponsorOptions() {
    const members = await this.memberRepository.findSponsorOptions();

    return members.map((member) => {
      const activeCourse =
        member.memberCourses?.find((mc) => mc.status === "active") ||
        member.memberCourses?.[0];
      const courseUniversity = activeCourse?.courseUniversity;

      return {
        id: member.id,
        name: member.name,
        slug: member.slug,
        profile_picture_url: member.profile_picture_url,
        course: courseUniversity?.course
          ? {
              id: courseUniversity.course.id,
              name: courseUniversity.course.name,
            }
          : undefined,
        university: courseUniversity?.university
          ? {
              id: courseUniversity.university.id,
              name: courseUniversity.university.name,
            }
          : undefined,
      };
    });
  }

  async getMemberById(id: string) {
    const member = await this.memberRepository.findByIdWithRelations(id);
    if (!member) throw new Error("Member not found");
    return member;
  }

  async getMemberByEmail(email: string) {
    const member = await this.memberRepository.findByEmail(email);
    if (!member) throw new Error("Member not found");
    return member;
  }

  async getMembersBySponsor(sponsorId: string) {
    const members = await this.memberRepository.findBySponsor(sponsorId);
    if (members.length === 0)
      throw new Error("No members found with this sponsor");
    return members;
  }

  async getPendingMembers() {
    return this.memberRepository.findByRegistrationStatus(
      MemberRegistrationStatus.PENDING,
    );
  }
  async getPendingMembersForReviewer(reviewerId: string): Promise<Member[]> {
  const reviewer =
    await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);

  if (!reviewer) throw new Error("Reviewer not found");

  const pending = await this.memberRepository.findByRegistrationStatus(
    MemberRegistrationStatus.PENDING,
  );

  // equipe técnica vê tudo
  if (reviewer.roles?.some(r => r.name === "EQUIPE_TECNICA")) {
    return pending;
  }

  const filtered = [];

  for (const member of pending) {
    const canAccess = await this.canReviewerAccessMember(
    reviewerId,
    member,
  );

    if (canAccess) {
      filtered.push(member);
    }
  }

  return filtered;
}
  async getMemberBySlug(slug: string): Promise<MemberProfileDto> {
    const member = await this.memberRepository.findByNameSlug(slug);
    if (!member) throw new Error("Member not found");

    let sponsor = null;
    if (member.sponsor) {
      const sponsorMember = await this.memberRepository.findById(
        member.sponsor,
      );
      sponsor = sponsorMember
        ? {
            id: sponsorMember.id,
            name: sponsorMember.name,
            profile_picture_url: sponsorMember.profile_picture_url,
          }
        : null;
    }

    let courseData;
    let universityData;
    if (member.memberCourses && member.memberCourses.length > 0) {
      const active = member.memberCourses.find(
        (mc) => mc.status === "active",
      );
      const chosen = active || member.memberCourses[0];
      if (chosen && chosen.courseUniversity) {
        const cu = chosen.courseUniversity;
        courseData = cu.course
          ? { id: cu.course.id, name: cu.course.name }
          : undefined;
        universityData = cu.university
          ? { id: cu.university.id, name: cu.university.name }
          : undefined;
      }
    }

    const profileDto: MemberProfileDto = {
      id: member.id,
      name: member.name,
      phone: member.phone,
      ra: member.ra,
      profile_picture_url: member.profile_picture_url,
      birth_date: member.birth_date,
      admission_date: member.admission_date,
      biography: member.biography,
      banner_url: member.banner_url,
      curriculum_url: member.curriculum_url,
      youtube_url: member.youtube_url,
      twitter_url: member.twitter_url,
      instagram_url: member.instagram_url,
      linkedin_url: member.linkedin_url,
      github_url: member.github_url,
      course: courseData,
      city: member.city
        ? {
            id: member.city.id,
            name: member.city.name,
          }
        : undefined,
      university: universityData,
      sponsor: sponsor || undefined,
      roles:
        member.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
        })) || undefined,
    };

    return profileDto;
  }

  async createMember(
    memberData: CreateMemberDto,
    password: string,
    defaultSponsorMemberId?: string,
  ) {
    if (memberData.confirm_password && memberData.confirm_password !== password) {
      throw new Error("Senha e confirmaÃ§Ã£o de senha nÃ£o conferem");
    }

    const academicData = await this.resolveAcademicData(memberData);
    const name = this.resolveMemberName(memberData);

    const normalizedData = {
      name,
      cpf: memberData.cpf.replace(/\D/g, ""),
      phone: memberData.phone,
      email_personal: memberData.email_personal,
      email_university: memberData.email_university,
      birth_date: new Date(memberData.birth_date),
      admission_date: new Date(memberData.admission_date),
      ra: String(memberData.ra),

      city_id: academicData.cityId || memberData.city_id || null,
      current_semester: memberData.current_semester || null,
      university_not_applicable: !!memberData.university_not_applicable,
      course_not_applicable: !!memberData.course_not_applicable,
      current_semester_not_applicable:
        !!memberData.current_semester_not_applicable,
      registration_status: MemberRegistrationStatus.PENDING,
      biography: memberData.biography || undefined,
    };

    if (!this.isValidCpf(normalizedData.cpf)) {
      throw new Error("CPF invalido");
    }

    const existing = await this.memberRepository.existsByEmailOrCpfOrRa(
      normalizedData.email_personal,
      normalizedData.email_university,
      normalizedData.cpf,
      normalizedData.ra,
    );

    if (existing) throw new Error("CPF, RA ou email já cadastrados");

    const sponsorId = await this.resolveSponsorId(
      memberData.sponsor,
      defaultSponsorMemberId,
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    const newMember = await this.memberRepository.create({
      ...normalizedData,
      password: hashedPassword,
      sponsor: sponsorId,
    });

    if (academicData.courseUniversityId) {
      await this.memberRepository.addCourseToMember(
        newMember.id,
        academicData.courseUniversityId,
        normalizedData.admission_date,
      );
    }

    const { password: _, ...safeMemberData } = newMember;

    // Gerar token de acesso automaticamente após signup
    const AuthService = (await import('./authService')).AuthService;
    const authService = new AuthService(this.memberRepository, this.tokenRepository);
    const accessToken = await authService['generateAccessToken'](newMember.id);

    return { member: safeMemberData, accessToken };

  }

  private async resolveSponsorId(
    sponsor?: string,
    defaultSponsorMemberId?: string,
  ): Promise<string | null> {
    const sponsorValue = sponsor?.trim();
    const defaultSponsorValue = defaultSponsorMemberId?.trim();

    if (defaultSponsorValue && !this.isUuid(defaultSponsorValue)) {
      throw new Error("memberId deve ser um UUID valido");
    }

    const selectedSponsor = sponsorValue || defaultSponsorValue;
    if (!selectedSponsor) return null;

    if (this.isUuid(selectedSponsor)) {
      const sponsorMember =
        await this.memberRepository.findById(selectedSponsor);

      if (!sponsorMember) {
        throw new Error("Padrinho informado nao encontrado");
      }

      return sponsorMember.id;
    }

    const sponsorMember = await this.memberRepository.findByName(selectedSponsor);
    return sponsorMember?.id || null;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private resolveMemberName(memberData: CreateMemberDto) {
    const name = memberData.name?.trim();
    if (name) return name;

    const composedName = [memberData.first_name, memberData.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!composedName) throw new Error("Nome do membro Ã© obrigatÃ³rio");

    return composedName;
  }

  private isValidCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    const calculateDigit = (base: string, factor: number) => {
      const total = base
        .split("")
        .reduce((sum, digit) => sum + Number(digit) * factor--, 0);
      const remainder = (total * 10) % 11;
      return remainder === 10 ? 0 : remainder;
    };

    const firstDigit = calculateDigit(digits.slice(0, 9), 10);
    const secondDigit = calculateDigit(digits.slice(0, 10), 11);

    return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
  }

  private async resolveAcademicData(memberData: CreateMemberDto): Promise<{
    cityId?: string;
    courseUniversityId?: string;
  }> {
    let cityId = memberData.city_id;

    if (!cityId && memberData.city_ibge_code && memberData.city_name) {
      if (!memberData.state_id && !memberData.state_uf) {
        throw new Error("Estado Ã© obrigatÃ³rio para cadastrar cidade pelo IBGE");
      }

      const state = memberData.state_id
        ? await this.stateRepository.findById(memberData.state_id)
        : await this.stateRepository.findOrCreateByUf(memberData.state_uf!);

      if (!state) throw new Error("Estado nÃ£o encontrado");

      const city = await this.cityRepository.findOrCreateFromIbge({
        name: memberData.city_name,
        ibge_code: memberData.city_ibge_code.replace(/\D/g, ""),
        state_id: state.id,
      });

      cityId = city?.id;
    }

    if (memberData.course_university_id) {
      return { cityId, courseUniversityId: memberData.course_university_id };
    }

    if (
      memberData.university_not_applicable ||
      memberData.course_not_applicable ||
      !cityId
    ) {
      return { cityId };
    }

    if (
      !memberData.university_id &&
      !memberData.university_name &&
      !memberData.university_emec_code
    ) {
      return { cityId };
    }

    const universityId =
      memberData.university_id ||
      (
        await this.universityRepository.findOrCreateByNormalizedName({
          name: memberData.university_name || memberData.university_emec_code!,
          acronym: memberData.university_acronym || null,
          emec_code: memberData.university_emec_code || null,
          city_id: cityId,
          source: memberData.university_emec_code ? "MEC_EMEC_CSV" : "USER_SIGNUP",
        })
      )?.id;

    if (!universityId || (!memberData.course_name && !memberData.course_id)) {
      return { cityId };
    }

    const courseId =
      memberData.course_id ||
      (await this.courseRepository.findOrCreateByName(memberData.course_name!))
        .id;

    const courseUniversity =
      await this.courseUniversityRepository.findOrCreate({
        course_id: courseId,
        university_id: universityId,
        city_id: cityId,
      });

    return { cityId, courseUniversityId: courseUniversity.id };
  }

  async updateMember(id: string, updateData: Partial<Member> & { course_university_id?: string }) {
    const existingMember = await this.memberRepository.findById(id);
    if (!existingMember) throw new Error("Member not found");

    if (updateData.course_university_id) {
      await this.memberRepository.addCourseToMember(
        id,
        updateData.course_university_id,
      );
      delete updateData.course_university_id;
    }

    return this.memberRepository.update(id, updateData);
  }

  async approveMemberRegistration(memberId: string, reviewerId: string) {
    await this.ensureCanReviewRegistration(memberId, reviewerId);
   const updated = await this.memberRepository.updateRegistrationStatus(
    memberId,
    MemberRegistrationStatus.APPROVED,
    reviewerId,
    );

    return {
    message: "Member approved successfully",
    member: updated,
    };
  }

  async rejectMemberRegistration(
  memberId: string,
  reviewerId: string,
  reason?: string,
) {
  await this.ensureCanReviewRegistration(memberId, reviewerId);

  const member = await this.memberRepository.findById(memberId);
  if (!member) throw new Error("Member not found");

  await this.memberRepository.delete(memberId);

  return {
    message: "Member rejected and deleted successfully",
    memberId,
  };
}

  private async ensureCanReviewRegistration(
    memberId: string,
    reviewerId: string,
  ) {
    const reviewer =
      await this.memberRepository.findByIdWithRolesAndPermissions(reviewerId);
    if (!reviewer) throw new Error("Reviewer not found");

    if (reviewer.roles?.some((role) => role.name === "EQUIPE_TECNICA")) {
      return;
    }

    const target = await this.memberRepository.findByIdWithRelations(memberId);
    if (!target) throw new Error("Member not found");

    const activeCourse = target.memberCourses?.find(
      (memberCourse) => memberCourse.status === "active",
    );
    const courseUniversity = activeCourse?.courseUniversity;
    const cityId = target.city_id || courseUniversity?.city_id;
    const stateId = target.city?.state?.id || courseUniversity?.city?.state?.id;
    const courseId = courseUniversity?.course_id;

    const checks = await Promise.all([
      courseUniversity
        ? this.isCourseManagerReviewer(reviewerId, courseUniversity.id)
        : Promise.resolve(false),
      courseId && target.current_semester
        ? this.isSemesterHeadReviewer(reviewerId, courseId, target.current_semester)
        : Promise.resolve(false),
      cityId ? this.isCarReviewer(reviewerId, cityId) : Promise.resolve(false),
      stateId ? this.isCaeReviewer(reviewerId, stateId) : Promise.resolve(false),
    ]);

    if (!checks.some(Boolean)) {
      throw new ForbiddenException(
        "VocÃª nÃ£o tem permissÃ£o para validar este cadastro",
      );
    }
  }

  private async isCourseManagerReviewer(
    reviewerId: string,
    courseUniversityId: string,
  ) {
    const result = await AppDataBase.query(
      `SELECT 1
       FROM course_managers
       WHERE member_id = $1
         AND course_university_id = $2
         AND end_date IS NULL
         AND deleted_at IS NULL
       LIMIT 1`,
      [reviewerId, courseUniversityId],
    );
    return result.length > 0;
  }

  private async isSemesterHeadReviewer(
    reviewerId: string,
    courseId: string,
    currentSemester: number,
  ) {
    const result = await AppDataBase.query(
      `SELECT 1
       FROM program_semester_heads psh
       JOIN program_semesters ps ON ps.id = psh.program_semester_id
       WHERE psh.member_id = $1
         AND ps.course_id = $2
         AND ps.semester_number = $3
         AND psh.end_date IS NULL
         AND psh.deleted_at IS NULL
       LIMIT 1`,
      [reviewerId, courseId, currentSemester],
    );
    return result.length > 0;
  }

  private async isCarReviewer(reviewerId: string, cityId: string) {
    const result = await AppDataBase.query(
      `SELECT 1
       FROM car_managers cm
       JOIN car_cities cc ON cc.car_id = cm.car_id
       WHERE cm.member_id = $1
         AND cc.city_id = $2
       LIMIT 1`,
      [reviewerId, cityId],
    );
    return result.length > 0;
  }

  private async isCaeReviewer(reviewerId: string, stateId: string) {
    const result = await AppDataBase.query(
      `SELECT 1
       FROM cae_managers cm
       JOIN caes c ON c.id = cm.cae_id
       WHERE cm.member_id = $1
         AND c.state_id = $2
         AND cm.end_date IS NULL
         AND cm.deleted_at IS NULL
       LIMIT 1`,
      [reviewerId, stateId],
    );
    return result.length > 0;
  }

  async getMemberRolesAndPermissions(id: string) {
    const member =
      await this.memberRepository.findByIdWithRolesAndPermissions(id);
    if (!member) throw new Error("Member not found");

    return {
      memberId: member.id,
      memberName: member.name,
      roles:
        member.roles?.map((role) => ({
          id: role.id,
          name: role.name,
          description: role.description,
          permissions:
            role.permissions?.map((perm) => ({
              id: perm.id,
              name: perm.name,
              description: perm.description,
            })) || [],
        })) || [],
    };
  }

  // Gerenciamento de Roles
  async addRoleToMember(memberId: string, roleName: 'EXTERNO' | 'EQUIPE_TECNICA') {
    const role = await RoleRepository.findOne({ where: { name: roleName } });
    if (!role) throw new Error(`Role ${roleName} não encontrada`);

    await AppDataBase.query(
      'INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [memberId, role.id]
    );

    // Invalidar tokens do usuário
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  async removeRoleFromMember(memberId: string, roleName: string) {
    const role = await RoleRepository.findOne({ where: { name: roleName } });
    if (!role) throw new Error(`Role ${roleName} não encontrada`);

    await AppDataBase.query(
      'DELETE FROM member_roles WHERE member_id = $1 AND role_id = $2',
      [memberId, role.id]
    );

    // Invalidar tokens do usuário
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  // Gerenciamento de Posições - DIRIGENTE
  async addDirigentePosition(memberId: string, courseUniversityId: string, startDate?: Date) {
    const manager = CourseManagerRepository.create({
      member_id: memberId,
      course_university_id: courseUniversityId,
      start_date: startDate || new Date(),
    });
    await CourseManagerRepository.save(manager);
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  async removeDirigentePosition(memberId: string, courseUniversityId: string) {
    const manager = await CourseManagerRepository.findOne({
      where: { member_id: memberId, course_university_id: courseUniversityId, end_date: null },
    });
    if (manager) {
      manager.end_date = new Date();
      await CourseManagerRepository.save(manager);
      await this.tokenRepository.deleteByMemberId(memberId);
    }
  }

  // Gerenciamento de Posições - CAR
  async addCarPosition(memberId: string, carId: string) {
    await AppDataBase.query(
      'INSERT INTO car_managers (car_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [carId, memberId]
    );
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  async removeCarPosition(memberId: string, carId: string) {
    await AppDataBase.query(
      'DELETE FROM car_managers WHERE car_id = $1 AND member_id = $2',
      [carId, memberId]
    );
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  // Gerenciamento de Posições - CAE
  async addCaePosition(memberId: string, caeId: string, startDate?: Date) {
    const manager = CaeManagerRepository.create({
      member_id: memberId,
      cae_id: caeId,
      start_date: startDate || new Date(),
    });
    await CaeManagerRepository.save(manager);
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  async removeCaePosition(memberId: string, caeId: string) {
    const manager = await CaeManagerRepository.findOne({
      where: { member_id: memberId, cae_id: caeId, end_date: null },
    });
    if (manager) {
      manager.end_date = new Date();
      await CaeManagerRepository.save(manager);
      await this.tokenRepository.deleteByMemberId(memberId);
    }
  }

  // Gerenciamento de Posições - REPRESENTANTE
  async addRepresentantePosition(memberId: string, programSemesterId: string, startDate?: Date) {
    await AppDataBase.query(
      'INSERT INTO program_semester_heads (program_semester_id, member_id, start_date) VALUES ($1, $2, $3)',
      [programSemesterId, memberId, startDate || new Date()]
    );
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  async removeRepresentantePosition(memberId: string, programSemesterId: string) {
    await AppDataBase.query(
      'UPDATE program_semester_heads SET end_date = NOW() WHERE program_semester_id = $1 AND member_id = $2 AND end_date IS NULL',
      [programSemesterId, memberId]
    );
    await this.tokenRepository.deleteByMemberId(memberId);
  }

  private async canReviewerAccessMember(
  reviewerId: string,
  member: Member,
): Promise<boolean> {
  const activeCourse = member.memberCourses?.find(
    (mc) => mc.status === "active",
  );

  const courseUniversity = activeCourse?.courseUniversity;

  const cityId = member.city_id || courseUniversity?.city_id;
  const stateId = member.city?.state?.id || courseUniversity?.city?.state?.id;
  const courseId = courseUniversity?.course_id;

  const checks = await Promise.all([
    courseUniversity
      ? this.isCourseManagerReviewer(reviewerId, courseUniversity.id)
      : false,

    courseId && member.current_semester
      ? this.isSemesterHeadReviewer(
          reviewerId,
          courseId,
          member.current_semester,
        )
      : false,

    cityId ? this.isCarReviewer(reviewerId, cityId) : false,

    stateId ? this.isCaeReviewer(reviewerId, stateId) : false,
  ]);

  return checks.some(Boolean);
}
}

