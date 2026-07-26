"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const MemberService_1 = require("../services/MemberService");
const create_member_dto_1 = require("../dto/members/create-member.dto");
const update_member_dto_1 = require("../dto/members/update-member.dto");
const tokenHelper_1 = require("../helpers/tokenHelper");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let MemberController = class MemberController {
    constructor(memberService) {
        this.memberService = memberService;
    }
    handleCreateMemberError(error) {
        if (error instanceof common_1.HttpException) {
            throw error;
        }
        const message = error instanceof Error ? error.message : "Erro ao criar cadastro.";
        const conflictMessages = [
            "CPF, RA ou email",
            "CPF, RA or email",
            "ja cadastrados",
            "jÃ¡ cadastrados",
        ];
        if (conflictMessages.some((item) => message.includes(item))) {
            throw new common_1.HttpException({ message }, common_1.HttpStatus.CONFLICT);
        }
        const badRequestMessages = [
            "CPF invalido",
            "CPF inv",
            "Senha",
            "Nome do membro",
            "Estado obrigatorio",
            "Cidade obrigatoria",
            "Universidade obrigatoria",
            "Curso obrigatorio",
            "Semestre atual obrigatorio",
            "Data de ingresso",
            "Padrinho",
            "memberId",
        ];
        if (badRequestMessages.some((item) => message.includes(item))) {
            throw new common_1.HttpException({ message }, common_1.HttpStatus.BAD_REQUEST);
        }
        throw error;
    }
    async getAllMembers() {
        return this.memberService.getAllMembers();
    }
    async getSponsorOptions() {
        return this.memberService.getSponsorOptions();
    }
    async getMemberBySlug(slug) {
        return this.memberService.getMemberBySlug(slug);
    }
    async getPendingMembers() {
        return this.memberService.getPendingMembers();
    }
    async approveMemberRegistration(id, req) {
        const user = req.user;
        const data = await this.memberService.approveMemberRegistration(id, user.id);
        return {
            message: "Cadastro aprovado com sucesso.",
            data,
        };
    }
    async rejectMemberRegistration(id, body, req) {
        const user = req.user;
        const data = await this.memberService.rejectMemberRegistration(id, user.id, body.reason);
        return {
            message: "Cadastro rejeitado com sucesso.",
            data,
        };
    }
    async searchMembers(q, limit) {
        return this.memberService.searchMembers(q ?? '', Number(limit) || 10);
    }
    async getMemberById(id) {
        return this.memberService.getMemberById(id);
    }
    async getMemberByEmail(email) {
        return this.memberService.getMemberByEmail(email);
    }
    async getMembersBySponsor(sponsorId) {
        return this.memberService.getMembersBySponsor(sponsorId);
    }
    async createNewMember(body, sponsorMemberId) {
        try {
            const result = await this.memberService.createMember(body, body.password, sponsorMemberId);
            return {
                message: "Otimo ter voce conosco, peco apenas mais um pouco de paciencia, seu cadastro esta em analise, sera notificado assim que esse processo for concluido.",
                data: result.member,
            };
        }
        catch (error) {
            this.handleCreateMemberError(error);
        }
    }
    async updateMemberData(id, updateData, req) {
        const user = req.user;
        // Apenas o próprio membro ou equipe técnica pode atualizar
        if (user.id !== id && !user.roles.includes('EQUIPE_TECNICA')) {
            throw new common_1.UnauthorizedException('Você não tem permissão para atualizar este membro');
        }
        const savedMember = await this.memberService.updateMember(id, updateData);
        return {
            message: "Member updated successfully!",
            data: savedMember,
        };
    }
    async getMemberRolesAndPermissions(memberId, authorization) {
        try {
            if (!authorization) {
                throw new common_1.UnauthorizedException("Authorization header is missing");
            }
            const token = authorization.replace("Bearer ", "");
            const memberIdFromAcessToken = (0, tokenHelper_1.getMemberIdFromAccessToken)(token);
            if (memberIdFromAcessToken !== memberId) {
                throw new common_1.UnauthorizedException("Token memberId does not match the requested memberId");
            }
            return this.memberService.getMemberRolesAndPermissions(memberId);
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            if (error instanceof Error &&
                error.message.includes("Token inválido ou expirado")) {
                throw new common_1.UnauthorizedException(error.message);
            }
            throw error;
        }
    }
    // Gerenciamento de Roles (apenas EQUIPE_TECNICA)
    async addRoleToMember(memberId, roleName) {
        if (!roleName)
            throw new common_1.HttpException({ message: 'roleName is required' }, common_1.HttpStatus.BAD_REQUEST);
        await this.memberService.addRoleToMember(memberId, roleName);
        return { message: 'Role adicionada com sucesso. Usuário deve fazer login novamente.' };
    }
    async removeRoleFromMember(memberId, roleName) {
        await this.memberService.removeRoleFromMember(memberId, roleName);
        return { message: 'Role removida com sucesso. Usuário deve fazer login novamente.' };
    }
    // Gerenciamento de Posições
    async addDirigentePosition(memberId, body) {
        await this.memberService.addDirigentePosition(memberId, body.courseUniversityId, body.startDate ? new Date(body.startDate) : undefined);
        return { message: 'Posição de DIRIGENTE adicionada. Usuário deve fazer login novamente.' };
    }
    async removeDirigentePosition(memberId, courseUniversityId) {
        await this.memberService.removeDirigentePosition(memberId, courseUniversityId);
        return { message: 'Posição de DIRIGENTE removida. Usuário deve fazer login novamente.' };
    }
    async addCarPosition(memberId, body) {
        await this.memberService.addCarPosition(memberId, body.carId);
        return { message: 'Posição de CAR adicionada. Usuário deve fazer login novamente.' };
    }
    async removeCarPosition(memberId, carId) {
        await this.memberService.removeCarPosition(memberId, carId);
        return { message: 'Posição de CAR removida. Usuário deve fazer login novamente.' };
    }
    async addCaePosition(memberId, body) {
        await this.memberService.addCaePosition(memberId, body.caeId, body.startDate ? new Date(body.startDate) : undefined);
        return { message: 'Posição de CAE adicionada. Usuário deve fazer login novamente.' };
    }
    async removeCaePosition(memberId, caeId) {
        await this.memberService.removeCaePosition(memberId, caeId);
        return { message: 'Posição de CAE removida. Usuário deve fazer login novamente.' };
    }
    async addRepresentantePosition(memberId, body) {
        await this.memberService.addRepresentantePosition(memberId, body.programSemesterId, body.startDate ? new Date(body.startDate) : undefined);
        return { message: 'Posição de REPRESENTANTE adicionada. Usuário deve fazer login novamente.' };
    }
    async removeRepresentantePosition(memberId, programSemesterId) {
        await this.memberService.removeRepresentantePosition(memberId, programSemesterId);
        return { message: 'Posição de REPRESENTANTE removida. Usuário deve fazer login novamente.' };
    }
};
exports.MemberController = MemberController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all members" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of all members" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getAllMembers", null);
__decorate([
    (0, common_1.Get)("sponsors/options"),
    (0, swagger_1.ApiOperation)({ summary: "Get sponsor options for signup" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of sponsor options" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getSponsorOptions", null);
__decorate([
    (0, common_1.Get)("profile/:slug"),
    (0, swagger_1.ApiOperation)({ summary: "Get member profile by slug (public)" }),
    (0, swagger_1.ApiParam)({
        name: "slug",
        type: String,
        example: "john-doe",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member profile found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Member not found" }),
    __param(0, (0, common_1.Param)("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMemberBySlug", null);
__decorate([
    (0, common_1.Get)("pending"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get pending member registrations" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Pending member registrations" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getPendingMembers", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Approve member registration" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Member ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member registration approved" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "approveMemberRegistration", null);
__decorate([
    (0, common_1.Patch)(":id/reject"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Reject member registration" }),
    (0, swagger_1.ApiParam)({ name: "id", type: String, description: "Member ID" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                reason: {
                    type: "string",
                    example: "Dados incompletos",
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member registration rejected" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "rejectMemberRegistration", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Search members by name or email" }),
    (0, swagger_1.ApiQuery)({ name: "q", type: String, description: "Search query" }),
    (0, swagger_1.ApiQuery)({ name: "limit", type: Number, required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Members found" }),
    __param(0, (0, common_1.Query)("q")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "searchMembers", null);
__decorate([
    (0, common_1.Get)("/:id"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get member by ID" }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Member not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMemberById", null);
__decorate([
    (0, common_1.Get)("email/:email"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get member by email" }),
    (0, swagger_1.ApiParam)({ name: "email", type: String, example: "user@example.com" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member found" }),
    (0, swagger_1.ApiResponse)({ status: 202, description: "Member not found" }),
    __param(0, (0, common_1.Param)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMemberByEmail", null);
__decorate([
    (0, common_1.Get)("sponsor/:sponsorId"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get members by sponsor" }),
    (0, swagger_1.ApiParam)({
        name: "sponsorId",
        type: String,
        example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Members found" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "No members found" }),
    __param(0, (0, common_1.Param)("sponsorId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMembersBySponsor", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Create new member (signup)" }),
    (0, swagger_1.ApiBody)({ type: create_member_dto_1.CreateMemberDto }),
    (0, swagger_1.ApiQuery)({
        name: "memberId",
        required: false,
        type: String,
        description: "Optional sponsor member ID used as the default signup sponsor",
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Member created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 409, description: "CPF, RA or email already exists" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)("memberId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_member_dto_1.CreateMemberDto, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "createNewMember", null);
__decorate([
    (0, common_1.Put)("id/:id"),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiOperation)({ summary: "Update member data" }),
    (0, swagger_1.ApiParam)({
        name: "id",
        type: String,
        example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
    }),
    (0, swagger_1.ApiBody)({ type: update_member_dto_1.UpdateMemberDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member updated successfully" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Member not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_member_dto_1.UpdateMemberDto, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "updateMemberData", null);
__decorate([
    (0, common_1.Get)(":memberId/roles-and-permissions"),
    (0, swagger_1.ApiOperation)({ summary: "Get member roles and permissions" }),
    (0, swagger_1.ApiParam)({
        name: "memberId",
        type: String,
        example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Member roles and permissions retrieved successfully",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Member not found" }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: "Unauthorized - Invalid token or memberId mismatch",
    }),
    __param(0, (0, common_1.Param)("memberId")),
    __param(1, (0, common_1.Headers)("authorization")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "getMemberRolesAndPermissions", null);
__decorate([
    (0, common_1.Post)(':memberId/roles'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add role to member (EQUIPE_TECNICA only)' }),
    (0, swagger_1.ApiBody)({ schema: { type: 'object', properties: { roleName: { type: 'string', example: 'EXTERNO' } }, required: ['roleName'] } }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role added successfully' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)('roleName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addRoleToMember", null);
__decorate([
    (0, common_1.Delete)(':memberId/roles/:roleName'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove role from member (EQUIPE_TECNICA only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Role removed successfully' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('roleName')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeRoleFromMember", null);
__decorate([
    (0, common_1.Post)(':memberId/positions/dirigente'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add DIRIGENTE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addDirigentePosition", null);
__decorate([
    (0, common_1.Delete)(':memberId/positions/dirigente/:courseUniversityId'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove DIRIGENTE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('courseUniversityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeDirigentePosition", null);
__decorate([
    (0, common_1.Post)(':memberId/positions/car'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add CAR position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addCarPosition", null);
__decorate([
    (0, common_1.Delete)(':memberId/positions/car/:carId'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove CAR position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('carId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeCarPosition", null);
__decorate([
    (0, common_1.Post)(':memberId/positions/cae'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add CAE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addCaePosition", null);
__decorate([
    (0, common_1.Delete)(':memberId/positions/cae/:caeId'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove CAE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('caeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeCaePosition", null);
__decorate([
    (0, common_1.Post)(':memberId/positions/representante'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Add REPRESENTANTE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "addRepresentantePosition", null);
__decorate([
    (0, common_1.Delete)(':memberId/positions/representante/:programSemesterId'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiOperation)({ summary: 'Remove REPRESENTANTE position (EQUIPE_TECNICA only)' }),
    __param(0, (0, common_1.Param)('memberId')),
    __param(1, (0, common_1.Param)('programSemesterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], MemberController.prototype, "removeRepresentantePosition", null);
exports.MemberController = MemberController = __decorate([
    (0, common_1.Controller)("members"),
    (0, swagger_1.ApiTags)("Members"),
    __metadata("design:paramtypes", [MemberService_1.MemberService])
], MemberController);
