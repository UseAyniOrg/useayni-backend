import { Controller, Get, Post, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CarService } from '../services/CarService';
import { CreateCarDto, AddManagerDto, ManageCitiesDto } from '../dto/car/car.dto';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('cars')
@ApiTags('CARs')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Get()
  @ApiOperation({ summary: 'List all CARs' })
  @ApiResponse({ status: 200, description: 'List of CARs' })
  async findAll() {
    return this.carService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CAR by ID' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiResponse({ status: 200, description: 'CAR found' })
  @ApiResponse({ status: 404, description: 'CAR not found' })
  async findById(@Param('id') id: string) {
    return this.carService.findById(id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get members by CAR', description: 'Returns all members living in cities covered by this CAR' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiResponse({ status: 200, description: 'List of members' })
  async getMembers(@Param('id') id: string) {
    return this.carService.getMembersByCar(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create CAR' })
  @ApiBody({ type: CreateCarDto })
  @ApiResponse({ status: 201, description: 'CAR created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async create(@Body() data: CreateCarDto) {
    return this.carService.create(data);
  }

  @Post(':id/managers')
  @ApiOperation({ summary: 'Add manager to CAR' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiBody({ type: AddManagerDto })
  @ApiResponse({ status: 200, description: 'Manager added' })
  @ApiResponse({ status: 404, description: 'CAR or member not found' })
  async addManager(@Param('id') carId: string, @Body() data: AddManagerDto) {
    return this.carService.assignManagerToCar(carId, data.memberId);
  }

  @Delete(':id/managers/:memberId')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove manager from CAR' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiParam({ name: 'memberId', type: String, description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Manager removed' })
  async removeManager(@Param('id') carId: string, @Param('memberId') memberId: string) {
    await this.carService.removeManagerFromCar(carId, memberId);
    return { message: 'Manager removed successfully' };
  }

  @Post(':id/cities')
  @ApiOperation({ summary: 'Add cities to CAR' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiBody({ type: ManageCitiesDto })
  @ApiResponse({ status: 200, description: 'Cities added' })
  @ApiResponse({ status: 404, description: 'CAR not found' })
  async addCities(@Param('id') carId: string, @Body() data: ManageCitiesDto) {
    return this.carService.assignCitiesToCar(carId, data.cityIds);
  }

  @Delete(':id/cities')
  @HttpCode(200)
  @ApiOperation({ summary: 'Remove cities from CAR' })
  @ApiParam({ name: 'id', type: String, description: 'CAR ID' })
  @ApiBody({ type: ManageCitiesDto })
  @ApiResponse({ status: 200, description: 'Cities removed' })
  async removeCities(@Param('id') carId: string, @Body() data: ManageCitiesDto) {
    await this.carService.removeCitiesFromCar(carId, data.cityIds);
    return { message: 'Cities removed successfully' };
  }
}
