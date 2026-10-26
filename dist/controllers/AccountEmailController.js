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
exports.AccountEmailController = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const AccountEmailService_1 = require("../services/AccountEmailService");
const emailRate_guard_1 = require("../middlewares/emailRate.guard");
const tokenSchema = zod_1.z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const passwordSchema = zod_1.z.string().min(1).max(128);
function parse(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success)
        throw new common_1.BadRequestException('Dados inválidos. Verifique o link e os campos informados.');
    return result.data;
}
let AccountEmailController = class AccountEmailController {
    constructor(service) {
        this.service = service;
    }
    inspect(body) {
        return this.service.inspectInvitation(parse(zod_1.z.object({ token: tokenSchema }), body).token);
    }
    accept(body) {
        const data = parse(zod_1.z.object({ token: tokenSchema, password: passwordSchema, full_name: zod_1.z.string().max(255).default('') }), body);
        return this.service.acceptInvitation(data.token, data.password, data.full_name);
    }
    requestReset(body, request) {
        const data = parse(zod_1.z.object({ email: zod_1.z.email().max(255) }), body);
        return this.service.requestPasswordReset(data.email, request.tenant?.organization_id);
    }
    reset(body) {
        const data = parse(zod_1.z.object({ token: tokenSchema, password: passwordSchema }), body);
        return this.service.resetPassword(data.token, data.password);
    }
};
exports.AccountEmailController = AccountEmailController;
__decorate([
    (0, common_1.Post)('invitation/inspect'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountEmailController.prototype, "inspect", null);
__decorate([
    (0, common_1.Post)('invitation/accept'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountEmailController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)('password-reset'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AccountEmailController.prototype, "requestReset", null);
__decorate([
    (0, common_1.Post)('password-reset/complete'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccountEmailController.prototype, "reset", null);
exports.AccountEmailController = AccountEmailController = __decorate([
    (0, common_1.Controller)('account-email'),
    (0, common_1.UseGuards)(emailRate_guard_1.EmailRateGuard),
    __metadata("design:paramtypes", [AccountEmailService_1.AccountEmailService])
], AccountEmailController);
