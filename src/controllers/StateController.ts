import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { StateRepository } from '../repositories/StateRepository';

@Controller('states')
@ApiTags('States')
export class StateController {
  constructor(private readonly stateRepository: StateRepository) {}

  @Get()
  @ApiOperation({ summary: 'List all states' })
  @ApiResponse({ status: 200, description: 'List of Brazilian states' })
  async findAll() {
    return this.stateRepository.findAll();
  }

  @Get('uf/:uf')
  @ApiOperation({ summary: 'Get state by UF' })
  @ApiParam({ name: 'uf', type: String, example: 'SP', description: 'State UF code' })
  @ApiResponse({ status: 200, description: 'State found' })
  @ApiResponse({ status: 404, description: 'State not found' })
  async findByUf(@Param('uf') uf: string) {
    return this.stateRepository.findByUf(uf);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get state by ID' })
  @ApiParam({ name: 'id', type: String, description: 'State ID' })
  @ApiResponse({ status: 200, description: 'State found' })
  @ApiResponse({ status: 404, description: 'State not found' })
  async findById(@Param('id') id: string) {
    return this.stateRepository.findById(id);
  }
}
