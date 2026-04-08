import { Controller, Get, Post, Param, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../services/authService';
import { LoginDto, RefreshTokenDto } from '../dto/members/login.dto';

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
  async login(@Body() body: LoginDto) {
    // Retorna: { member, accessToken, refreshToken? }
    // JWT contém: id, email, name, isActive, roles, positions
    return this.authService.login(body.personalEmail, body.password, body.rememberMe);
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiParam({ name: 'id', type: String, example: 'b314b18f-26d6-4f97-9ed2-1f3942f8b787' })
  @ApiResponse({ status: 200, description: 'Profile retrieved' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getProfile(@Param('id') id: string) {
    return this.authService.getProfile(id);
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
  async logout(@Headers('authorization') authorization: string) {
    const accessToken = authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('Token não fornecido');
    }
    await this.authService.logout(accessToken);
    return { message: 'Logout realizado com sucesso' };
  }
}
