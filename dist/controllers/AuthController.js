"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const authService_1 = require("../services/authService");
const login_dto_1 = require("../dto/members/login.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(body) {
        // Retorna: { member, accessToken, refreshToken? }
        // JWT contém: id, email, name, isActive, roles, positions
        return this.authService.login(body.personalEmail, body.password, body.rememberMe);
    }
    async refreshToken(body) {
        return this.authService.refreshToken(body.refreshToken);
    }
    async getProfile(id) {
        return this.authService.getProfile(id);
    }
    async validate(authorization) {
        const accessToken = authorization?.split(' ')[1];
        if (!accessToken) {
            throw new Error('Token não fornecido');
        }
        const decoded = await this.authService.verifyAccessToken(accessToken);
        return { valid: true, user: decoded };
    }
    async validateToken(authorization) {
        const accessToken = authorization?.split(' ')[1];
        if (!accessToken) {
            throw new Error('Token não fornecido');
        }
        return this.authService.validateAccessToken(accessToken);
    }
    async logout(authorization) {
        const accessToken = authorization?.split(' ')[1];
        if (!accessToken) {
            throw new Error('Token não fornecido');
        }
        await this.authService.logout(accessToken);
        return { message: 'Logout realizado com sucesso' };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'User login (signin)' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful - Returns member data and JWT with positions' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh authentication token' }),
    (0, swagger_1.ApiBody)({ type: login_dto_1.RefreshTokenDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Refresh successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Get)('profile/:id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, example: 'b314b18f-26d6-4f97-9ed2-1f3942f8b787' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('verify-access-token'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Validate access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token is valid' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Token invalid or expired' }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)('validate-access-token'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Validate access authentication token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Access token is valid' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Access token invalid or expired' }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'User logout' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid token' }),
    __param(0, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, swagger_1.ApiTags)('Authentication'),
    __metadata("design:paramtypes", [authService_1.AuthService])
], AuthController);
