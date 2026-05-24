import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionService } from '../services/PermissionService';
import { CreatePermissionDto, UpdatePermissionDto } from '../dto/permission.dto';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('permissions')
@ApiTags('Permissions')
@UseGuards(AuthorizationGuard)
@ApiBearerAuth()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiOperation({ 
    summary: 'List all permissions',
    description: 'Returns all permissions in the system'
  })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findAll() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get permission by ID',
    description: 'Returns a permission with its details'
  })
  @ApiParam({ name: 'id', type: String, description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission found' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async findById(@Param('id') id: string) {
    return this.permissionService.findById(id);
  }

  @Get('resource/:resource')
  @ApiOperation({ 
    summary: 'Get permissions by resource',
    description: 'Returns all permissions for a specific resource (e.g., members, projects)'
  })
  @ApiParam({ name: 'resource', type: String, example: 'members', description: 'Resource name' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  async findByResource(@Param('resource') resource: string) {
    return this.permissionService.findByResource(resource);
  }

  @Post()
  @ApiOperation({ 
    summary: 'Create permission',
    description: 'Creates a new permission in the system'
  })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ status: 201, description: 'Permission created' })
  @ApiResponse({ status: 400, description: 'Invalid data or permission already exists' })
  async create(@Body() data: CreatePermissionDto) {
    return this.permissionService.create(data);
  }

  @Put(':id')
  @ApiOperation({ 
    summary: 'Update permission',
    description: 'Updates permission details'
  })
  @ApiParam({ name: 'id', type: String, description: 'Permission ID' })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({ status: 200, description: 'Permission updated' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async update(@Param('id') id: string, @Body() data: UpdatePermissionDto) {
    return this.permissionService.update(id, data);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Delete permission',
    description: 'Deletes a permission from the system'
  })
  @ApiParam({ name: 'id', type: String, description: 'Permission ID' })
  @ApiResponse({ status: 200, description: 'Permission deleted' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  async delete(@Param('id') id: string) {
    await this.permissionService.delete(id);
    return { message: 'Permission deleted successfully' };
  }
}
