import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UniversityRepository } from '../repositories/UniversityRepository';
import { CreateUniversityDto } from '../dto/academic/university.dto';

@Controller('universities')
@ApiTags('Universities')
export class UniversityController {
  constructor(private readonly universityRepository: UniversityRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all universities' })
  @ApiResponse({ status: 200, description: 'List of universities' })
  async findAll() {
    return this.universityRepository.findAll();
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
    return (
      university?.courseUniversities
        ?.map((cu) => cu.course)
        .filter(Boolean) ?? []
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create university' })
  @ApiBody({ type: CreateUniversityDto })
  @ApiResponse({ status: 201, description: 'University created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() data: CreateUniversityDto) {
    return this.universityRepository.create(data);
  }
}
