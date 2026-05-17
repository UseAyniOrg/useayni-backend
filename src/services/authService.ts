import { Injectable } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { authConfig } from "../config/auth";
import { Member } from "../models/member";
import { MemberRepository } from "../repositories/MemberRepository";
import { TokenRepository } from "../repositories/TokenRepository";
import { JWTPayload, MemberPosition } from "../helpers/tokenHelper";

@Injectable()
export class AuthService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}

  async login(email: string, password: string, rememberMe?: boolean) {
   const member = await this.memberRepository.findByEmailWithPassword(email);

    if (!member) {
     throw new Error("Credenciais inválidas");
    }

    if (member.status !== "APPROVED") {
      throw new Error("Cadastro pendente de aprovação");
    }

    const passwordMatch = await bcrypt.compare(password, member.password);

    if (!passwordMatch) {
      throw new Error("Credenciais inválidas");
    }

    const accessToken = await this.generateAccessToken(member.id);

    let refreshToken: string | undefined;
    if (rememberMe) {
      refreshToken = await this.generateRefreshToken(member);
    }

    const { password: _, roles, ...memberWithoutPassword } = member;

    return {
      member: { ...memberWithoutPassword, roles: roles?.map(r => r.name) || [] },
      accessToken,
      refreshToken,
    };
  }
  async getProfile(userId: string) {
    const member = await this.memberRepository.findById(userId);
    if (!member) throw new Error("Usuário não encontrado");
    return member;
  }

  async refreshToken(refreshToken: string) {
    if (!authConfig.jwt.refreshSecret) throw new Error("JWT refresh secret is not defined");

    const tokenData = await this.tokenRepository.findByToken(refreshToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error("Refresh token inválido ou expirado");
    }

    const secret = authConfig.jwt.refreshSecret;
    const decoded = jwt.verify(refreshToken, secret) as { id: string };
    const member = await this.memberRepository.findById(decoded.id);
    if (!member) throw new Error("Usuário não encontrado");

    const accessToken = await this.generateAccessToken(member.id);
    const newRefreshToken = await this.generateRefreshToken(member);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async validateAccessToken(accessToken: string) {
    const tokenData = await this.tokenRepository.findByToken(accessToken);
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error("Token inválido ou expirado");
    }
    return { valid: true };
  }

  private async generateAccessToken(memberId: string): Promise<string> {
    if (!authConfig.jwt.secret) throw new Error("JWT secret is not defined");

    await this.tokenRepository.deleteByMemberIdAndType(memberId, "access");

    // Buscar membro com todas as posições
    const memberData = await this.memberRepository.findByIdWithPositions(memberId);
    if (!memberData) throw new Error("Membro não encontrado");

    const roles = memberData.roles?.map(role => role.name) || [];
    const isActive = memberData.memberCourses?.some(mc => mc.status === 'active') || false;

    // Montar posições
    const positions: MemberPosition[] = [];

    // REPRESENTANTE
    if (memberData.positions.semesterHeads) {
      memberData.positions.semesterHeads.forEach((sh: any) => {
        positions.push({
          type: 'REPRESENTANTE',
          id: sh.program_semester_id,
          name: `${sh.semester_number}º Semestre - ${sh.course_name}`,
        });
      });
    }

    // DIRIGENTE
    if (memberData.positions.courseManagers) {
      memberData.positions.courseManagers.forEach((cm: any) => {
        positions.push({
          type: 'DIRIGENTE',
          id: cm.course_university_id,
          name: `${cm.course_name} - ${cm.university_name} - ${cm.city_name}`,
        });
      });
    }

    // CAR
    if (memberData.positions.carManagers) {
      memberData.positions.carManagers.forEach((cm: any) => {
        positions.push({
          type: 'CAR',
          id: cm.car_id,
          name: cm.car_name,
        });
      });
    }

    // CAE
    if (memberData.positions.caeManagers) {
      memberData.positions.caeManagers.forEach((cm: any) => {
        positions.push({
          type: 'CAE',
          id: cm.cae_id,
          name: `${cm.cae_name} - ${cm.state_name}`,
        });
      });
    }

    const payload: JWTPayload = {
      id: memberData.id,
      email: memberData.email_personal,
      name: memberData.name,
      isActive,
      roles,
      positions,
    };

    const token = jwt.sign(payload, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: memberData.id,
      type: "access",
      expiresAt: new Date(decoded.exp * 1000),
    });

    return token;
  }

  private async generateRefreshToken(member: Member): Promise<string> {
    if (!authConfig.jwt.refreshSecret) throw new Error("JWT refresh secret is not defined");

    await this.tokenRepository.deleteByMemberIdAndType(member.id, "refresh");

    const token = jwt.sign(
      {
        id: member.id,
      },
      authConfig.jwt.refreshSecret,
      { expiresIn: authConfig.jwt.refreshExpiresIn },
    );
    const decoded = jwt.decode(token) as { exp: number };
    await this.tokenRepository.save({
      token,
      memberId: member.id,
      type: "refresh",
      expiresAt: new Date(decoded.exp * 1000),
    });
    return token;
  }

  async logout(accessToken: string) {
    const tokenData = await this.tokenRepository.findByToken(accessToken);
    if (!tokenData) throw new Error("Token não encontrado");

    await this.tokenRepository.deleteByMemberId(tokenData.memberId);
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    if (!authConfig.jwt.secret) throw new Error("JWT secret is not defined");

    try {
      return jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
    } catch (error) {
      throw new Error("Token inválido ou expirado");
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const savedToken = await this.tokenRepository.findByToken(token);
    return !savedToken;
  }
}
