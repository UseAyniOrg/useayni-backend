import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MiscellaneousService } from '../services/MiscellaneousService';
import { CreateMiscellaneousDto } from '../dto/miscellaneous/create-miscellaneous.dto';
import { RespondInvitationDto } from '../dto/miscellaneous/respond-invitation.dto';
import { decodeToken, JWTPayload } from '../helpers/tokenHelper';

@Controller('miscellaneous')
@ApiTags('Miscellaneous')
@ApiBearerAuth()
export class MiscellaneousController {
  constructor(private readonly miscellaneousService: MiscellaneousService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova miscelânea' })
  @ApiBody({ type: CreateMiscellaneousDto })
  @ApiResponse({ status: 201, description: 'Miscelânea criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  async create(
    @Body() dto: CreateMiscellaneousDto,
    @Headers('authorization') authorization: string,
  ) {
    const user = this.getUser(authorization);
    const miscellaneous = await this.miscellaneousService.create(dto, user);
    return {
      message: 'Miscelânea processada com sucesso',
      status: miscellaneous?.status,
      data: miscellaneous,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar miscelâneas públicas ativas (paginada)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de miscelâneas' })
  async findPublicActive(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.miscellaneousService.findPublicActive(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter miscelânea por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Miscelânea encontrada' })
  @ApiResponse({ status: 404, description: 'Miscelânea não encontrada' })
  async findById(@Param('id') id: string) {
    return this.miscellaneousService.findById(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprovar miscelânea pendente (gestor do nível)' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Miscelânea aprovada' })
  @HttpCode(HttpStatus.OK)
  async approve(
    @Param('id') id: string,
    @Headers('authorization') authorization: string,
  ) {
    const user = this.getUser(authorization);
    return this.miscellaneousService.approve(id, user);
  }

  @Post(':id/invitations/respond')
  @ApiOperation({ summary: 'Aceitar ou recusar convite (seleção individual)' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: RespondInvitationDto })
  @ApiResponse({ status: 200, description: 'Convite respondido' })
  @HttpCode(HttpStatus.OK)
  async respondInvitation(
    @Param('id') id: string,
    @Body() dto: RespondInvitationDto,
    @Headers('authorization') authorization: string,
  ) {
    const user = this.getUser(authorization);
    return this.miscellaneousService.respondInvitation(id, user, dto.response);
  }

  private getUser(authorization?: string): JWTPayload {
    if (!authorization) {
      throw new UnauthorizedException('Token não fornecido');
    }
    const token = authorization.replace('Bearer ', '');
    try {
      return decodeToken(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }
}
