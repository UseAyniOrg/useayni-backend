import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CaeService } from '../services/CaeService';
import { Roles } from '../middlewares/permissionMiddleware';
import { RequirePosition } from '../middlewares/requirePosition.decorator';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Request } from 'express';

@Controller('caes')
@UseGuards(AuthorizationGuard)
export class CaeController {
  constructor(private readonly caeService: CaeService) {}

  @Get()
  async findAll() {
    return this.caeService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.caeService.findById(id);
  }

  @Get('state/:stateId')
  async findByState(@Param('stateId') stateId: string) {
    return this.caeService.findByStateId(stateId);
  }

  @Post()
  @Roles('EQUIPE_TECNICA')
  async create(@Body() data: { name: string; state_id: string }) {
    return this.caeService.create(data);
  }

  @Put(':id')
  @RequirePosition('CAE')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<{ name: string; state_id: string }>,
    @Req() req: Request,
  ) {
    // Validar se é gestor desta CAE específica
    const user = req.user!;
    const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
    const isTechTeam = user.roles.includes('EQUIPE_TECNICA');

    if (!isManager && !isTechTeam) {
      throw new Error('Acesso negado: você não é gestor desta CAE');
    }

    return this.caeService.update(id, data);
  }

  @Delete(':id')
  @Roles('EQUIPE_TECNICA')
  async delete(@Param('id') id: string) {
    await this.caeService.delete(id);
    return { message: 'CAE removida com sucesso' };
  }

  @Post(':id/managers')
  @RequirePosition('CAE')
  async addManager(
    @Param('id') id: string,
    @Body() data: { member_id: string; start_date?: string },
    @Req() req: Request,
  ) {
    const user = req.user!;
    const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
    const isTechTeam = user.roles.includes('EQUIPE_TECNICA');

    if (!isManager && !isTechTeam) {
      throw new Error('Acesso negado: você não é gestor desta CAE');
    }

    const startDate = data.start_date ? new Date(data.start_date) : undefined;
    return this.caeService.addManager(id, data.member_id, startDate);
  }

  @Delete(':id/managers/:memberId')
  @RequirePosition('CAE')
  async removeManager(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const user = req.user!;
    const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
    const isTechTeam = user.roles.includes('EQUIPE_TECNICA');

    if (!isManager && !isTechTeam) {
      throw new Error('Acesso negado: você não é gestor desta CAE');
    }

    await this.caeService.removeManager(id, memberId);
    return { message: 'Gestor removido com sucesso' };
  }

  @Get(':id/managers')
  async getManagers(@Param('id') id: string) {
    return this.caeService.getManagers(id);
  }
}
