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
exports.StateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const StateRepository_1 = require("../repositories/StateRepository");
let StateController = class StateController {
    constructor(stateRepository) {
        this.stateRepository = stateRepository;
    }
    async findAll() {
        return this.stateRepository.findAll();
    }
    async findByUf(uf) {
        return this.stateRepository.findByUf(uf);
    }
    async findById(id) {
        return this.stateRepository.findById(id);
    }
};
exports.StateController = StateController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all states' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of Brazilian states' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('uf/:uf'),
    (0, swagger_1.ApiOperation)({ summary: 'Get state by UF' }),
    (0, swagger_1.ApiParam)({ name: 'uf', type: String, example: 'SP', description: 'State UF code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'State found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'State not found' }),
    __param(0, (0, common_1.Param)('uf')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StateController.prototype, "findByUf", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get state by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'State ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'State found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'State not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StateController.prototype, "findById", null);
exports.StateController = StateController = __decorate([
    (0, common_1.Controller)('states'),
    (0, swagger_1.ApiTags)('States'),
    __metadata("design:paramtypes", [StateRepository_1.StateRepository])
], StateController);
