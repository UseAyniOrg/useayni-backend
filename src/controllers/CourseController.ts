import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CourseRepository } from '../repositories/CourseRepository';
import { CreateCourseDto } from '../dto/academic/course.dto';
import { LinkCourseUniversityDto, CreateProgramSemesterDto, CreateAcademicTermDto, CreateSemesterOfferingDto, CreateEnrollmentDto } from '../dto/academic/course-university.dto';
import { AppDataBase } from '../db';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('courses')
@ApiTags('Courses')
export class CourseController {
  constructor(private readonly courseRepository: CourseRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all courses' })
  @ApiQuery({ name: 'universityId', required: false, description: 'Filter by university ID' })
  @ApiQuery({ name: 'cityId', required: false, description: 'Filter by city ID' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async findAll(
    @Query('universityId') universityId?: string,
    @Query('cityId') cityId?: string,
  ) {
    if (universityId) {
      return this.courseRepository.findByUniversity(universityId, cityId);
    }
    return this.courseRepository.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course found' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async findById(@Param('id') id: string) {
    return this.courseRepository.findById(id);
  }

  @Post()
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create course' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Course created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() data: CreateCourseDto) {
    return this.courseRepository.create(data);
  }

  @Post('link-university')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link course to university and city' })
  @ApiBody({ type: LinkCourseUniversityDto })
  @ApiResponse({ status: 201, description: 'Course linked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async linkUniversity(@Body() data: LinkCourseUniversityDto) {
    const result = await AppDataBase.query(
      `INSERT INTO course_universities (course_id, university_id, city_id) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (course_id, university_id, city_id) DO UPDATE SET updated_at = now() 
       RETURNING *`,
      [data.courseId, data.universityId, data.cityId]
    );
    return result[0];
  }

  @Post('semesters')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create program semester' })
  @ApiBody({ type: CreateProgramSemesterDto })
  @ApiResponse({ status: 201, description: 'Semester created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createSemester(@Body() data: CreateProgramSemesterDto) {
    const result = await AppDataBase.query(
      `INSERT INTO program_semesters (course_id, semester_number) 
       VALUES ($1, $2) 
       ON CONFLICT (course_id, semester_number) DO UPDATE SET updated_at = now() 
       RETURNING *`,
      [data.courseId, data.semester_number]
    );
    return result[0];
  }

  @Post('academic-terms')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create academic term' })
  @ApiBody({ type: CreateAcademicTermDto })
  @ApiResponse({ status: 201, description: 'Academic term created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createAcademicTerm(@Body() data: CreateAcademicTermDto) {
    const result = await AppDataBase.query(
      `INSERT INTO academic_terms (year, term, starts_at, ends_at) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (year, term) DO UPDATE SET updated_at = now() 
       RETURNING *`,
      [data.year, data.term, data.starts_at || null, data.ends_at || null]
    );
    return result[0];
  }

  @Post('semester-offerings')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create semester offering' })
  @ApiBody({ type: CreateSemesterOfferingDto })
  @ApiResponse({ status: 201, description: 'Semester offering created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createSemesterOffering(@Body() data: CreateSemesterOfferingDto) {
    const result = await AppDataBase.query(
      `INSERT INTO semester_offerings (course_university_id, program_semester_id, academic_term_id, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (course_university_id, program_semester_id, academic_term_id) DO UPDATE SET updated_at = now() 
       RETURNING *`,
      [data.course_university_id, data.program_semester_id, data.academic_term_id, data.status || 'planned']
    );
    return result[0];
  }

  @Post('enrollments')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll member in semester' })
  @ApiBody({ type: CreateEnrollmentDto })
  @ApiResponse({ status: 201, description: 'Enrollment created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createEnrollment(@Body() data: CreateEnrollmentDto) {
    const result = await AppDataBase.query(
      `INSERT INTO enrollments (member_id, semester_offering_id, status) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (member_id, semester_offering_id) DO UPDATE SET updated_at = now() 
       RETURNING *`,
      [data.member_id, data.semester_offering_id, data.status || 'active']
    );
    return result[0];
  }
}
