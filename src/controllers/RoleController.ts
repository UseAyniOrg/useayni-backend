import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { RoleService } from '../services/RoleService';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  AssignRoleToMemberDto,
} from '../dto/role.dto';
import { Roles } from '../middlewares/permissionMiddleware';
import { AuthorizationGuard } from '../middlewares/authorization.guard';

@Controller('roles')
@ApiTags('Roles')
@UseGuards(AuthorizationGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @ApiOperation({
    summary: 'List all roles',
    description: 'Returns all roles with their permissions',
  })
  @ApiResponse({ status: 200, description: 'List of roles' })
  async findAll() {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Returns a role with permissions and members',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Get('name/:name')
  @ApiOperation({
    summary: 'Get role by name',
    description: 'Returns a role by its name (e.g., MEMBRO, DIRIGENTE)',
  })
  @ApiParam({ name: 'name', type: String, example: 'DIRIGENTE', description: 'Role name' })
  @ApiResponse({ status: 200, description: 'Role found' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async findByName(@Param('name') name: string) {
    return this.roleService.findByName(name);
  }

  @Post()
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({
    summary: 'Create role ',
    description:
      'Creates a new role in the system - DEPRECATED: Only EXTERNO and EQUIPE_TECNICA should exist',
  })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ status: 201, description: 'Role created' })
  @ApiResponse({ status: 400, description: 'Invalid data or role already exists' })
  async create(@Body() data: CreateRoleDto) {
    return this.roleService.create(data);
  }

  @Put(':id')
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({
    summary: 'Update role ',
    description: 'Updates role name and/or description',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() data: UpdateRoleDto) {
    return this.roleService.update(id, data);
  }

  @Delete(':id')
  @Roles('EQUIPE_TECNICA')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete role ',
    description: 'Deletes a role from the system',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async delete(@Param('id') id: string) {
    await this.roleService.delete(id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({
    summary: 'Assign permissions to role ',
    description: 'Replaces all permissions of a role with the provided list',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({ status: 200, description: 'Permissions assigned' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async assignPermissions(@Param('id') roleId: string, @Body() data: AssignPermissionsDto) {
    return this.roleService.assignPermissions(roleId, data.permissionIds);
  }

  @Post(':id/members')
  @Roles('EQUIPE_TECNICA')
  @ApiOperation({
    summary: 'Assign role to member  - DEPRECATED',
    description: 'Use POST /members/:memberId/roles instead',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiBody({ type: AssignRoleToMemberDto })
  @ApiResponse({ status: 200, description: 'Role assigned to member' })
  @ApiResponse({ status: 404, description: 'Role or member not found' })
  async assignToMember(@Param('id') roleId: string, @Body() data: AssignRoleToMemberDto) {
    return this.roleService.assignToMember(roleId, data.memberId);
  }

  @Delete(':id/members/:memberId')
  @Roles('EQUIPE_TECNICA')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Remove role from member  - DEPRECATED',
    description: 'Use DELETE /members/:memberId/roles/:roleName instead',
  })
  @ApiParam({ name: 'id', type: String, description: 'Role ID' })
  @ApiParam({ name: 'memberId', type: String, description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Role removed from member' })
  async removeFromMember(@Param('id') roleId: string, @Param('memberId') memberId: string) {
    return this.roleService.removeFromMember(roleId, memberId);
  }
}
