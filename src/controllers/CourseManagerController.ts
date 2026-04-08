import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CourseManagerService } from '../services/CourseManagerService';
import { Roles } from '../middlewares/permissionMiddleware';
import { RequirePosition } from '../middlewares/requirePosition.decorator';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('course-managers')
@ApiTags('Course Managers (Dirigentes)')
@UseGuards(AuthorizationGuard)
export class CourseManagerController {
  constructor(private readonly courseManagerService: CourseManagerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all course managers' })
  async findAll() {
    return this.courseManagerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course manager by ID' })
  async findById(@Param('id') id: string) {
    return this.courseManagerService.findById(id);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get course managers by member ID' })
  async findByMember(@Param('memberId') memberId: string) {
    return this.courseManagerService.findByMemberId(memberId);
  }

  @Get('course-university/:courseUniversityId')
  @ApiOperation({ summary: 'Get course managers by course university ID' })
  async findByCourseUniversity(@Param('courseUniversityId') courseUniversityId: string) {
    return this.courseManagerService.findByCourseUniversityId(courseUniversityId);
  }

  @Post()
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Add course manager (EQUIPE_TECNICA only)' })
  @ApiResponse({ status: 201, description: 'Course manager added successfully' })
  async create(
    @Body() data: { course_university_id: string; member_id: string; start_date?: string },
  ) {
    const startDate = data.start_date ? new Date(data.start_date) : undefined;
    return this.courseManagerService.create({
      course_university_id: data.course_university_id,
      member_id: data.member_id,
      start_date: startDate,
    });
  }

  @Put(':id/end')
  @RequirePosition('DIRIGENTE')
  @ApiOperation({ summary: 'End course management' })
  async endManagement(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const manager = await this.courseManagerService.findById(id);
    
    if (!manager) {
      throw new Error('Dirigente não encontrado');
    }

    // Validar se é o próprio dirigente ou equipe técnica
    const isOwnManager = manager.member_id === user.id;
    const isTechTeam = user.roles.includes('EQUIPE_TECNICA');

    if (!isOwnManager && !isTechTeam) {
      throw new Error('Acesso negado: você não pode encerrar este vínculo');
    }

    await this.courseManagerService.endManagement(id);
    return { message: 'Vínculo de dirigente encerrado com sucesso' };
  }

  @Delete(':id')
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({ summary: 'Delete course manager (EQUIPE_TECNICA only)' })
  async delete(@Param('id') id: string) {
    await this.courseManagerService.delete(id);
    return { message: 'Dirigente removido com sucesso' };
  }
}
