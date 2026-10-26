import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { FeatureFlagGuard, RequireFeature } from '../middlewares/requireFeature.decorator';
import { Roles } from '../middlewares/permissionMiddleware';
import { OrgUnitService } from '../services/OrgUnitService';

// ─── OrgUnit Types ─────────────────────────────────────────────────────────────

@Controller('org/types')
@ApiTags('Org Unit Types')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('hierarchy')
@Roles('organization.admin', 'organization.manage')
@ApiBearerAuth()
export class OrgUnitTypeController {
  constructor(private readonly service: OrgUnitService) {}

  @Get()
  @ApiOperation({ summary: 'List hierarchy types for the current organization' })
  list(@Req() req: Request) {
    const orgId = req.tenant!.organization_id;
    return this.service.listTypes(orgId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new hierarchy type' })
  create(
    @Body() body: { slug: string; name: string; metadata_schema?: Record<string, unknown> },
    @Req() req: Request,
  ) {
    return this.service.createType(
      { ...body, organization_id: req.tenant!.organization_id },
      req.user!.id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update hierarchy type' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; metadata_schema?: Record<string, unknown> },
    @Req() req: Request,
  ) {
    return this.service.updateType(id, req.tenant!.organization_id, body, req.user!.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete hierarchy type' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.deleteType(id, req.tenant!.organization_id, req.user!.id);
  }
}

// ─── OrgUnits ──────────────────────────────────────────────────────────────────

@Controller('org/units')
@ApiTags('Org Units')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('hierarchy')
@Roles('organization.admin', 'organization.manage')
@ApiBearerAuth()
export class OrgUnitController {
  constructor(private readonly service: OrgUnitService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Get full hierarchy tree' })
  getTree(@Req() req: Request) {
    return this.service.getTree(req.tenant!.organization_id);
  }

  @Get()
  @ApiOperation({ summary: 'List all org units (flat)' })
  list(@Req() req: Request) {
    return this.service.listAll(req.tenant!.organization_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get org unit by ID' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findById(id, req.tenant!.organization_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create org unit' })
  create(
    @Body()
    body: {
      type_id: string;
      name: string;
      slug?: string;
      parent_id?: string;
      metadata?: Record<string, unknown>;
    },
    @Req() req: Request,
  ) {
    return this.service.create(
      { ...body, organization_id: req.tenant!.organization_id },
      req.user!.id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update org unit' })
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; status?: string; parent_id?: string | null; metadata?: Record<string, unknown> },
    @Req() req: Request,
  ) {
    return this.service.update(id, req.tenant!.organization_id, body, req.user!.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete org unit' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.remove(id, req.tenant!.organization_id, req.user!.id);
  }

  // ─── Mandates within a unit ────────────────────────────────────────────────

  @Get(':id/mandates')
  @ApiOperation({ summary: 'List mandates for a unit' })
  listMandates(@Param('id') id: string, @Req() req: Request) {
    return this.service.listMandatesByUnit(id, req.tenant!.organization_id);
  }
}

// ─── Positions ─────────────────────────────────────────────────────────────────

@Controller('org/positions')
@ApiTags('Positions (Cargos)')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('hierarchy')
@Roles('organization.admin', 'organization.manage')
@ApiBearerAuth()
export class PositionController {
  constructor(private readonly service: OrgUnitService) {}

  @Get()
  @ApiOperation({ summary: 'List all positions for the organization' })
  list(@Req() req: Request) {
    return this.service.listPositions(req.tenant!.organization_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get position by ID' })
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findPositionById(id, req.tenant!.organization_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create position' })
  create(
    @Body()
    body: {
      org_unit_type_id: string;
      name: string;
      investiture_type?: string;
      mandate_duration_days?: number;
      allows_deputy?: boolean;
    },
    @Req() req: Request,
  ) {
    return this.service.createPosition(
      { ...body, organization_id: req.tenant!.organization_id },
      req.user!.id,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update position' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      investiture_type?: string;
      mandate_duration_days?: number;
      allows_deputy?: boolean;
    },
    @Req() req: Request,
  ) {
    return this.service.updatePosition(id, req.tenant!.organization_id, body, req.user!.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete position' })
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.service.removePosition(id, req.tenant!.organization_id, req.user!.id);
  }
}

// ─── Mandates ──────────────────────────────────────────────────────────────────

@Controller('org/mandates')
@ApiTags('Mandates')
@UseGuards(AuthorizationGuard, FeatureFlagGuard)
@RequireFeature('hierarchy')
@Roles('organization.admin', 'organization.manage')
@ApiBearerAuth()
export class MandateController {
  constructor(private readonly service: OrgUnitService) {}

  @Get()
  @ApiOperation({ summary: 'List all mandates for the organization' })
  list(@Req() req: Request) {
    return this.service.listMandates(req.tenant!.organization_id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create mandate (assign member to position in a unit)' })
  create(
    @Body()
    body: {
      position_id: string;
      org_unit_id: string;
      member_id: string;
      start_date: string;
      end_date?: string;
    },
    @Req() req: Request,
  ) {
    return this.service.createMandate(
      {
        ...body,
        organization_id: req.tenant!.organization_id,
        start_date: new Date(body.start_date),
        end_date: body.end_date ? new Date(body.end_date) : undefined,
      },
      req.user!.id,
    );
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Close mandate' })
  close(@Param('id') id: string, @Req() req: Request) {
    return this.service.closeMandate(id, req.tenant!.organization_id, req.user!.id, false);
  }

  @Patch(':id/revoke')
  @ApiOperation({ summary: 'Revoke mandate' })
  revoke(@Param('id') id: string, @Req() req: Request) {
    return this.service.closeMandate(id, req.tenant!.organization_id, req.user!.id, true);
  }

  @Get('member/:memberId')
  @ApiOperation({ summary: 'Get active mandates for a member' })
  forMember(@Param('memberId') memberId: string, @Req() req: Request) {
    return this.service.getActiveMandatesForMember(memberId, req.tenant!.organization_id);
  }
}
