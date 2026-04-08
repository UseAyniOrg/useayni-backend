import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  Headers,
  HttpException,
  UnauthorizedException,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { MemberService } from "../services/MemberService";
import { CreateMemberDto } from "../dto/members/create-member.dto";
import { UpdateMemberDto } from "../dto/members/update-member.dto";
import { getMemberIdFromAccessToken } from "../helpers/tokenHelper";
import { Roles } from "../middlewares/permissionMiddleware";
import { AuthorizationGuard } from "../middlewares/authorization.guard";
import { Request } from "express";

@Controller("members")
@ApiTags("Members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @ApiOperation({ summary: "Get all members" })
  @ApiResponse({ status: 200, description: "List of all members" })
  async getAllMembers() {
    return this.memberService.getAllMembers();
  }

  @Get("profile/:slug")
  @ApiOperation({ summary: "Get member profile by slug (public)" })
  @ApiParam({
    name: "slug",
    type: String,
    example: "john-doe",
  })
  @ApiResponse({ status: 200, description: "Member profile found" })
  @ApiResponse({ status: 404, description: "Member not found" })
  async getMemberBySlug(@Param("slug") slug: string) {
    return this.memberService.getMemberBySlug(slug);
  }

  @Get("/:id")
  @ApiOperation({ summary: "Get member by ID" })
  @ApiParam({
    name: "id",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiResponse({ status: 200, description: "Member found" })
  @ApiResponse({ status: 404, description: "Member not found" })
  async getMemberById(@Param("id") id: string) {
    return this.memberService.getMemberById(id);
  }

  @Get("email/:email")
  @ApiOperation({ summary: "Get member by email" })
  @ApiParam({ name: "email", type: String, example: "user@example.com" })
  @ApiResponse({ status: 200, description: "Member found" })
  @ApiResponse({ status: 202, description: "Member not found" })
  async getMemberByEmail(@Param("email") email: string) {
    return this.memberService.getMemberByEmail(email);
  }

  @Get("sponsor/:sponsorId")
  @ApiOperation({ summary: "Get members by sponsor" })
  @ApiParam({
    name: "sponsorId",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiResponse({ status: 200, description: "Members found" })
  @ApiResponse({ status: 404, description: "No members found" })
  async getMembersBySponsor(@Param("sponsorId") sponsorId: string) {
    return this.memberService.getMembersBySponsor(sponsorId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create new member (signup)" })
  @ApiBody({ type: CreateMemberDto })
  @ApiResponse({ status: 201, description: "Member created successfully" })
  @ApiResponse({ status: 409, description: "CPF, RA or email already exists" })
  async createNewMember(@Body() body: CreateMemberDto) {
    const { password, ...memberData } = body;
    const result = await this.memberService.createMember(
      memberData,
      password,
    );
    return {
      message: "Membro criado com sucesso!",
      data: result.member,
      accessToken: result.accessToken,
    };
  }

  @Put("id/:id")
  @UseGuards(AuthorizationGuard)
  @ApiOperation({ summary: "Update member data" })
  @ApiParam({
    name: "id",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiBody({ type: UpdateMemberDto })
  @ApiResponse({ status: 200, description: "Member updated successfully" })
  @ApiResponse({ status: 404, description: "Member not found" })
  async updateMemberData(
    @Param("id") id: string,
    @Body() updateData: UpdateMemberDto,
    @Req() req: Request,
  ) {
    const user = req.user!;
    
    // Apenas o próprio membro ou equipe técnica pode atualizar
    if (user.id !== id && !user.roles.includes('EQUIPE_TECNICA')) {
      throw new UnauthorizedException('Você não tem permissão para atualizar este membro');
    }

    const savedMember = await this.memberService.updateMember(id, updateData);
    return {
      message: "Member updated successfully!",
      data: savedMember,
    };
  }

  @Get(":memberId/roles-and-permissions")
  @ApiOperation({ summary: "Get member roles and permissions" })
  @ApiParam({
    name: "memberId",
    type: String,
    example: "b314b18f-26d6-4f97-9ed2-1f3942f8b787",
  })
  @ApiResponse({
    status: 200,
    description: "Member roles and permissions retrieved successfully",
  })
  @ApiResponse({ status: 404, description: "Member not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid token or memberId mismatch",
  })
  async getMemberRolesAndPermissions(
    @Param("memberId") memberId: string,
    @Headers("authorization") authorization: string,
  ) {
    try {
      if (!authorization) {
        throw new UnauthorizedException("Authorization header is missing");
      }

      const token = authorization.replace("Bearer ", "");

      const memberIdFromAcessToken = getMemberIdFromAccessToken(token);
      if (memberIdFromAcessToken !== memberId) {
        throw new UnauthorizedException(
          "Token memberId does not match the requested memberId",
        );
      }
      return this.memberService.getMemberRolesAndPermissions(memberId);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.message.includes("Token inválido ou expirado")
      ) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }

  // Gerenciamento de Roles (apenas EQUIPE_TECNICA)
  @Post(':memberId/roles')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add role to member (EQUIPE_TECNICA only)' })
  @ApiResponse({ status: 200, description: 'Role added successfully' })
  async addRoleToMember(
    @Param('memberId') memberId: string,
    @Body() body: { roleName: 'EXTERNO' | 'EQUIPE_TECNICA' },
  ) {
    await this.memberService.addRoleToMember(memberId, body.roleName);
    return { message: 'Role adicionada com sucesso. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/roles/:roleName')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove role from member (EQUIPE_TECNICA only)' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  async removeRoleFromMember(
    @Param('memberId') memberId: string,
    @Param('roleName') roleName: string,
  ) {
    await this.memberService.removeRoleFromMember(memberId, roleName);
    return { message: 'Role removida com sucesso. Usuário deve fazer login novamente.' };
  }

  // Gerenciamento de Posições
  @Post(':memberId/positions/dirigente')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add DIRIGENTE position (EQUIPE_TECNICA only)' })
  async addDirigentePosition(
    @Param('memberId') memberId: string,
    @Body() body: { courseUniversityId: string; startDate?: string },
  ) {
    await this.memberService.addDirigentePosition(
      memberId,
      body.courseUniversityId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de DIRIGENTE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/dirigente/:courseUniversityId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove DIRIGENTE position (EQUIPE_TECNICA only)' })
  async removeDirigentePosition(
    @Param('memberId') memberId: string,
    @Param('courseUniversityId') courseUniversityId: string,
  ) {
    await this.memberService.removeDirigentePosition(memberId, courseUniversityId);
    return { message: 'Posição de DIRIGENTE removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/car')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add CAR position (EQUIPE_TECNICA only)' })
  async addCarPosition(
    @Param('memberId') memberId: string,
    @Body() body: { carId: string },
  ) {
    await this.memberService.addCarPosition(memberId, body.carId);
    return { message: 'Posição de CAR adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/car/:carId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove CAR position (EQUIPE_TECNICA only)' })
  async removeCarPosition(
    @Param('memberId') memberId: string,
    @Param('carId') carId: string,
  ) {
    await this.memberService.removeCarPosition(memberId, carId);
    return { message: 'Posição de CAR removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/cae')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add CAE position (EQUIPE_TECNICA only)' })
  async addCaePosition(
    @Param('memberId') memberId: string,
    @Body() body: { caeId: string; startDate?: string },
  ) {
    await this.memberService.addCaePosition(
      memberId,
      body.caeId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de CAE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/cae/:caeId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove CAE position (EQUIPE_TECNICA only)' })
  async removeCaePosition(
    @Param('memberId') memberId: string,
    @Param('caeId') caeId: string,
  ) {
    await this.memberService.removeCaePosition(memberId, caeId);
    return { message: 'Posição de CAE removida. Usuário deve fazer login novamente.' };
  }

  @Post(':memberId/positions/representante')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add REPRESENTANTE position (EQUIPE_TECNICA only)' })
  async addRepresentantePosition(
    @Param('memberId') memberId: string,
    @Body() body: { programSemesterId: string; startDate?: string },
  ) {
    await this.memberService.addRepresentantePosition(
      memberId,
      body.programSemesterId,
      body.startDate ? new Date(body.startDate) : undefined,
    );
    return { message: 'Posição de REPRESENTANTE adicionada. Usuário deve fazer login novamente.' };
  }

  @Delete(':memberId/positions/representante/:programSemesterId')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Remove REPRESENTANTE position (EQUIPE_TECNICA only)' })
  async removeRepresentantePosition(
    @Param('memberId') memberId: string,
    @Param('programSemesterId') programSemesterId: string,
  ) {
    await this.memberService.removeRepresentantePosition(memberId, programSemesterId);
    return { message: 'Posição de REPRESENTANTE removida. Usuário deve fazer login novamente.' };
  }
}
