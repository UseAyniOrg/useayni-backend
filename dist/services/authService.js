"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt = __importStar(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_1 = require("../config/auth");
const member_1 = require("../models/member");
const MemberRepository_1 = require("../repositories/MemberRepository");
const TokenRepository_1 = require("../repositories/TokenRepository");
const PENDING_REGISTRATION_MESSAGE = "Otimo ter voce conosco, peco apenas mais um pouco de paciencia, seu cadastro esta em analise, sera notificado assim que esse processo for concluido.";
let AuthService = class AuthService {
    constructor(memberRepository, tokenRepository) {
        this.memberRepository = memberRepository;
        this.tokenRepository = tokenRepository;
    }
    assertMemberCanAccessSystem(member) {
        if (member.registration_status === member_1.MemberRegistrationStatus.PENDING) {
            throw new common_1.ForbiddenException(PENDING_REGISTRATION_MESSAGE);
        }
        if (member.registration_status === member_1.MemberRegistrationStatus.REJECTED) {
            throw new common_1.ForbiddenException(member.registration_rejection_reason
                ? `Seu cadastro foi rejeitado. Motivo: ${member.registration_rejection_reason}`
                : "Seu cadastro foi rejeitado.");
        }
        if (member.registration_status !== member_1.MemberRegistrationStatus.APPROVED) {
            throw new common_1.ForbiddenException("Seu cadastro ainda não foi aprovado.");
        }
    }
    async login(email, password, rememberMe) {
        const member = await this.memberRepository.findByEmailWithPassword(email);
        if (!member) {
            throw new common_1.UnauthorizedException("Credenciais invalidas");
        }
        const passwordMatch = await bcryptjs_1.default.compare(password, member.password);
        if (!passwordMatch) {
            throw new common_1.UnauthorizedException("Credenciais invalidas");
        }
        this.assertMemberCanAccessSystem(member);
        const accessToken = await this.generateAccessToken(member.id);
        let refreshToken;
        if (rememberMe) {
            refreshToken = await this.generateRefreshToken(member);
        }
        const { password: _, roles, ...memberWithoutPassword } = member;
        return {
            member: {
                ...memberWithoutPassword,
                roles: roles?.map((r) => r.name) || [],
            },
            accessToken,
            refreshToken,
        };
    }
    async getProfile(userId) {
        const member = await this.memberRepository.findById(userId);
        if (!member)
            throw new Error("Usuario nao encontrado");
        return member;
    }
    async refreshToken(refreshToken) {
        if (!auth_1.authConfig.jwt.refreshSecret)
            throw new Error("JWT refresh secret is not defined");
        const tokenData = await this.tokenRepository.findByToken(refreshToken);
        if (!tokenData || tokenData.expiresAt < new Date()) {
            throw new Error("Refresh token invalido ou expirado");
        }
        const secret = auth_1.authConfig.jwt.refreshSecret;
        const decoded = jwt.verify(refreshToken, secret);
        const member = await this.memberRepository.findById(decoded.id);
        if (!member)
            throw new Error("Usuario nao encontrado");
        this.assertMemberCanAccessSystem(member);
        const accessToken = await this.generateAccessToken(member.id);
        const newRefreshToken = await this.generateRefreshToken(member);
        return { accessToken, refreshToken: newRefreshToken };
    }
    async validateAccessToken(accessToken) {
        const tokenData = await this.tokenRepository.findByToken(accessToken);
        if (!tokenData || tokenData.expiresAt < new Date()) {
            throw new Error("Token invalido ou expirado");
        }
        return { valid: true };
    }
    async generateAccessToken(memberId) {
        if (!auth_1.authConfig.jwt.secret)
            throw new Error("JWT secret is not defined");
        await this.tokenRepository.deleteByMemberIdAndType(memberId, "access");
        const memberData = await this.memberRepository.findByIdWithPositions(memberId);
        if (!memberData)
            throw new Error("Membro nao encontrado");
        const roles = memberData.roles?.map((role) => role.name) || [];
        const isActive = memberData.memberCourses?.some((mc) => mc.status === "active") || false;
        const positions = [];
        if (memberData.positions.semesterHeads) {
            memberData.positions.semesterHeads.forEach((sh) => {
                positions.push({
                    type: "REPRESENTANTE",
                    id: sh.program_semester_id,
                    name: `${sh.semester_number} Semestre - ${sh.course_name}`,
                });
            });
        }
        if (memberData.positions.courseManagers) {
            memberData.positions.courseManagers.forEach((cm) => {
                positions.push({
                    type: "DIRIGENTE",
                    id: cm.course_university_id,
                    name: `${cm.course_name} - ${cm.university_name} - ${cm.city_name}`,
                });
            });
        }
        if (memberData.positions.carManagers) {
            memberData.positions.carManagers.forEach((cm) => {
                positions.push({
                    type: "CAR",
                    id: cm.car_id,
                    name: cm.car_name,
                });
            });
        }
        if (memberData.positions.caeManagers) {
            memberData.positions.caeManagers.forEach((cm) => {
                positions.push({
                    type: "CAE",
                    id: cm.cae_id,
                    name: `${cm.cae_name} - ${cm.state_name}`,
                });
            });
        }
        const payload = {
            id: memberData.id,
            email: memberData.email_personal,
            name: memberData.name,
            isActive,
            roles,
            positions,
        };
        const token = jwt.sign(payload, auth_1.authConfig.jwt.secret, {
            expiresIn: auth_1.authConfig.jwt.expiresIn,
        });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: memberData.id,
            type: "access",
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    async generateRefreshToken(member) {
        if (!auth_1.authConfig.jwt.refreshSecret)
            throw new Error("JWT refresh secret is not defined");
        await this.tokenRepository.deleteByMemberIdAndType(member.id, "refresh");
        const token = jwt.sign({
            id: member.id,
        }, auth_1.authConfig.jwt.refreshSecret, { expiresIn: auth_1.authConfig.jwt.refreshExpiresIn });
        const decoded = jwt.decode(token);
        await this.tokenRepository.save({
            token,
            memberId: member.id,
            type: "refresh",
            expiresAt: new Date(decoded.exp * 1000),
        });
        return token;
    }
    async logout(accessToken) {
        const tokenData = await this.tokenRepository.findByToken(accessToken);
        if (!tokenData)
            throw new Error("Token não encontrado");
        await this.tokenRepository.deleteByMemberId(tokenData.memberId);
    }
    async verifyAccessToken(token) {
        if (!auth_1.authConfig.jwt.secret)
            throw new Error("JWT secret is not defined");
        try {
            return jwt.verify(token, auth_1.authConfig.jwt.secret);
        }
        catch (error) {
            throw new Error("Token invalido ou expirado");
        }
    }
    async isTokenRevoked(token) {
        const savedToken = await this.tokenRepository.findByToken(token);
        return !savedToken;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [MemberRepository_1.MemberRepository,
        TokenRepository_1.TokenRepository])
], AuthService);
