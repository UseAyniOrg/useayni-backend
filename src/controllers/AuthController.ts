import { Controller, Get, Post, Param, Body, Headers, HttpCode, HttpStatus, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/authService';
import { LoginDto, RefreshTokenDto, SwitchOrganizationDto } from '../dto/members/login.dto';
import { AuthorizationGuard } from '../middlewares/authorization.guard';
import { Request } from 'express';

@Controller('auth')
@ApiTags('Authentication')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login (signin)' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful - Returns member data and JWT with positions' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: LoginDto, @Req() request: Request) {
    if (body.access_context === 'platform' && request.headers.origin) {
      const host = new URL(request.headers.origin).hostname;
      if (/^[^.]+\.(?:useayni\.com|localhost)$/.test(host) &&
          !['www.useayni.com', 'admin.useayni.com', 'api.useayni.com'].includes(host)) {
        throw new ForbiddenException('O SuperAdmin deve entrar pelo endereço da plataforma.');
      }
    }
    // Retorna: { member, accessToken, refreshToken? }
    // JWT contém: id, email, name, isActive, roles, positions
    return this.authService.login(
      body.personalEmail,
      body.password,
      body.rememberMe,
      request.tenant?.slug ?? request.tenantSlugHint,
      body.access_context,
    );
  }

  @Post('switch-organization')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch the active organization for the authenticated account' })
  async switchOrganization(
    @Body() body: SwitchOrganizationDto,
    @Req() request: Request,
  ) {
    return this.authService.switchOrganization(
      request.user?.account_id,
      body.tenant_slug,
      body.rememberMe,
    );
  }

  @Post('end-support-access')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End the current platform support session' })
  async endSupportAccess(@Req() request: Request) {
    return this.authService.endSupportAccess(
      request.user?.support_session_id,
      request.user!.id,
      request.user?.account_id,
    );
  }

  @Post('change-temporary-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace a one-time password before using the account' })
  async changeTemporaryPassword(
    @Body() body: { new_password: string; full_name: string },
    @Req() request: Request,
  ) {
    return this.authService.changeTemporaryPassword(request.user?.account_id, body.new_password, request.user?.id, body.full_name);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh authentication token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 200, description: 'Refresh successful' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('profile/:id')
  @UseGuards(AuthorizationGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiParam({ name: 'id', type: String, example: 'b314b18f-26d6-4f97-9ed2-1f3942f8b787' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('id') id: string, @Req() request: Request) {
    return this.authService.getProfile(id, request.tenant!.organization_id);
  }

  @Get('verify-access-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate access token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token invalid or expired' })
  async validate(@Headers('authorization') authorization: string) {
    const accessToken = authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Token não fornecido');
    }
    const decoded = await this.authService.verifyAccessToken(accessToken);
    return { valid: true, user: decoded };
  }

  @Get('validate-access-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate access authentication token' })
  @ApiResponse({ status: 200, description: 'Access token is valid' })
  @ApiResponse({ status: 401, description: 'Access token invalid or expired' })
  async validateToken(@Headers('authorization') authorization: string) {
    const accessToken = authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Token não fornecido');
    }
    return this.authService.validateAccessToken(accessToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Invalid token' })
  async logout(@Headers('authorization') authorization: string, @Body() body: { refreshToken?: string }) {
    const accessToken = authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Token não fornecido');
    }
    await this.authService.logout(accessToken, body?.refreshToken);
    return { message: 'Logout realizado com sucesso' };
  }
}
