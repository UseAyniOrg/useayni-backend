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
exports.CaeController = void 0;
const common_1 = require("@nestjs/common");
const CaeService_1 = require("../services/CaeService");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
const requirePosition_decorator_1 = require("../middlewares/requirePosition.decorator");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let CaeController = class CaeController {
    constructor(caeService) {
        this.caeService = caeService;
    }
    async findAll() {
        return this.caeService.findAll();
    }
    async findById(id) {
        return this.caeService.findById(id);
    }
    async findByState(stateId) {
        return this.caeService.findByStateId(stateId);
    }
    async create(data) {
        return this.caeService.create(data);
    }
    async update(id, data, req) {
        // Validar se é gestor desta CAE específica
        const user = req.user;
        const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
        const isTechTeam = user.roles.includes('EQUIPE_TECNICA');
        if (!isManager && !isTechTeam) {
            throw new Error('Acesso negado: você não é gestor desta CAE');
        }
        return this.caeService.update(id, data);
    }
    async delete(id) {
        await this.caeService.delete(id);
        return { message: 'CAE removida com sucesso' };
    }
    async addManager(id, data, req) {
        const user = req.user;
        const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
        const isTechTeam = user.roles.includes('EQUIPE_TECNICA');
        if (!isManager && !isTechTeam) {
            throw new Error('Acesso negado: você não é gestor desta CAE');
        }
        const startDate = data.start_date ? new Date(data.start_date) : undefined;
        return this.caeService.addManager(id, data.member_id, startDate);
    }
    async removeManager(id, memberId, req) {
        const user = req.user;
        const isManager = user.positions.some(p => p.type === 'CAE' && p.id === id);
        const isTechTeam = user.roles.includes('EQUIPE_TECNICA');
        if (!isManager && !isTechTeam) {
            throw new Error('Acesso negado: você não é gestor desta CAE');
        }
        await this.caeService.removeManager(id, memberId);
        return { message: 'Gestor removido com sucesso' };
    }
    async getManagers(id) {
        return this.caeService.getManagers(id);
    }
};
exports.CaeController = CaeController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)('state/:stateId'),
    __param(0, (0, common_1.Param)('stateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "findByState", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, requirePosition_decorator_1.RequirePosition)('CAE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':id/managers'),
    (0, requirePosition_decorator_1.RequirePosition)('CAE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "addManager", null);
__decorate([
    (0, common_1.Delete)(':id/managers/:memberId'),
    (0, requirePosition_decorator_1.RequirePosition)('CAE'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('memberId')),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "removeManager", null);
__decorate([
    (0, common_1.Get)(':id/managers'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CaeController.prototype, "getManagers", null);
exports.CaeController = CaeController = __decorate([
    (0, common_1.Controller)('caes'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    __metadata("design:paramtypes", [CaeService_1.CaeService])
], CaeController);
