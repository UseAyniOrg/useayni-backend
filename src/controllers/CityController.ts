import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CityRepository } from '../repositories/CityRepository';
import { CreateCityDto } from '../dto/academic/city.dto';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('cities')
@ApiTags('Cities')
export class CityController {
  constructor(private readonly cityRepository: CityRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all cities' })
  @ApiQuery({ name: 'stateId', required: false, description: 'Filter by state ID' })
  @ApiQuery({ name: 'state_id', required: false, description: 'Filter by state ID' })
  @ApiQuery({ name: 'stateUf', required: false, description: 'Filter by state UF' })
  @ApiResponse({ status: 200, description: 'List of cities' })
  async findAll(
    @Query('stateId') stateId?: string,
    @Query('state_id') state_id?: string,
    @Query('stateUf') stateUf?: string,
  ) {
    stateId = stateId || state_id;
    if (stateUf) {
      return this.cityRepository.findByStateUf(stateUf);
    }
    if (stateId && stateId.length === 2) {
      return this.cityRepository.findByStateUf(stateId);
    }
    if (stateId) {
      return this.cityRepository.findByState(stateId);
    }
    return this.cityRepository.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get city by ID' })
  @ApiParam({ name: 'id', type: String, description: 'City ID' })
  @ApiResponse({ status: 200, description: 'City found' })
  @ApiResponse({ status: 404, description: 'City not found' })
  async findById(@Param('id') id: string) {
    return this.cityRepository.findById(id);
  }

  @Post()
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create city' })
  @ApiBody({ type: CreateCityDto })
  @ApiResponse({ status: 201, description: 'City created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() data: CreateCityDto) {
    return this.cityRepository.create(data);
  }
}
