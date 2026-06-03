import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UniversityRepository } from '../repositories/UniversityRepository';
import { CreateUniversityDto } from '../dto/academic/university.dto';
import { MecUniversitySyncService } from '../services/MecUniversitySyncService';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Roles } from '../middlewares/permissionMiddleware';

@Controller('universities')
@ApiTags('Universities')
export class UniversityController {
  constructor(
    private readonly universityRepository: UniversityRepository,
    private readonly mecUniversitySyncService: MecUniversitySyncService,
  ) {}

  @Post('sync/mec')
  @UseGuards(AuthorizationGuard)
  @Roles('EQUIPE_TECNICA')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync universities from MEC/e-MEC open data CSV' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Import inactive/extinct institutions too. Defaults to false.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Optional row limit for testing the import routine.',
  })
  @ApiResponse({ status: 201, description: 'MEC universities synchronized' })
  async syncFromMec(
    @Query('includeInactive') includeInactive?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mecUniversitySyncService.syncFromMecCsv({
      includeInactive: includeInactive === 'true',
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List all universities' })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filter by city ID' })
  @ApiQuery({ name: 'city_id', required: false, description: 'Filter by city ID' })
  @ApiQuery({ name: 'stateId', required: false, description: 'Filter by state ID or UF' })
  @ApiQuery({ name: 'state_id', required: false, description: 'Filter by state ID or UF' })
  @ApiQuery({ name: 'stateUf', required: false, description: 'Filter by state UF' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name or acronym' })
  @ApiResponse({ status: 200, description: 'List of universities' })
  async findAll(
    @Query('cityId') cityId?: string,
    @Query('city_id') city_id?: string,
    @Query('stateId') stateId?: string,
    @Query('state_id') state_id?: string,
    @Query('stateUf') stateUf?: string,
    @Query('q') q?: string,
  ) {
    cityId = cityId || city_id;
    stateId = stateId || state_id;

    return this.universityRepository.findAll({
      cityId,
      stateId: stateId && stateId.length !== 2 ? stateId : undefined,
      stateUf: stateUf || (stateId?.length === 2 ? stateId : undefined),
      q,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get university by ID' })
  @ApiParam({ name: 'id', type: String, description: 'University ID' })
  @ApiResponse({ status: 200, description: 'University found' })
  @ApiResponse({ status: 404, description: 'University not found' })
  async findById(@Param('id') id: string) {
    return this.universityRepository.findById(id);
  }

  @Get(':id/courses')
  @ApiOperation({ summary: 'Get courses by university' })
  @ApiParam({ name: 'id', type: String, description: 'University ID' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async getCourses(@Param('id') id: string) {
    const university = await this.universityRepository.findById(id);
    return university?.courseUniversities?.map((courseUniversity) => ({
      id: courseUniversity.course.id,
      name: courseUniversity.course.name,
      course_university_id: courseUniversity.id,
    })) || [];
  }

  @Post()
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create university' })
  @ApiBody({ type: CreateUniversityDto })
  @ApiResponse({ status: 201, description: 'University created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() data: CreateUniversityDto) {
    return this.universityRepository.create(data);
  }
}
