import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Roles } from '../middlewares/permissionMiddleware';
import { ExternalProfileTypesService } from '../services/ExternalProfileTypesService';

@Controller('org/external-profile-types')
@UseGuards(AuthorizationGuard)
@Roles('organization.admin', 'organization.manage')
export class ExternalProfileTypesController {
  constructor(private readonly service: ExternalProfileTypesService) {}
  @Get()
  list(@Req() req: Request) { return this.service.list(req.tenant!.organization_id); }
  @Put()
  save(@Body() body: unknown, @Req() req: Request) {
    return this.service.save(req.tenant!.organization_id, body, req.user?.account_id);
  }
}

@Controller('organizations/:id/external-profile-types')
@UseGuards(AuthorizationGuard)
@Roles('EQUIPE_TECNICA')
export class PlatformExternalProfileTypesController {
  constructor(private readonly service: ExternalProfileTypesService) {}
  @Get()
  list(@Param('id') id: string) { return this.service.list(id); }
  @Put()
  save(@Param('id') id: string, @Body() body: unknown, @Req() req: Request) {
    return this.service.save(id, body, req.user?.account_id);
  }
}
