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
exports.CityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const CityRepository_1 = require("../repositories/CityRepository");
const city_dto_1 = require("../dto/academic/city.dto");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let CityController = class CityController {
    constructor(cityRepository) {
        this.cityRepository = cityRepository;
    }
    async findAll(stateId, state_id, stateUf) {
        stateId = stateId || state_id;
        if (stateUf) {
            return this.cityRepository.findByStateUf(stateUf);
        }
        if (stateId && stateId.length === 2) {
            return this.cityRepository.findByStateUf(stateId);
        }
        if (stateId) {
            return this.cityRepository.findByState(stateId);
        }
        return this.cityRepository.findAll();
    }
    async findById(id) {
        return this.cityRepository.findById(id);
    }
    async create(data) {
        return this.cityRepository.create(data);
    }
};
exports.CityController = CityController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all cities' }),
    (0, swagger_1.ApiQuery)({ name: 'stateId', required: false, description: 'Filter by state ID' }),
    (0, swagger_1.ApiQuery)({ name: 'state_id', required: false, description: 'Filter by state ID' }),
    (0, swagger_1.ApiQuery)({ name: 'stateUf', required: false, description: 'Filter by state UF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of cities' }),
    __param(0, (0, common_1.Query)('stateId')),
    __param(1, (0, common_1.Query)('state_id')),
    __param(2, (0, common_1.Query)('stateUf')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get city by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'City ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'City found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'City not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create city' }),
    (0, swagger_1.ApiBody)({ type: city_dto_1.CreateCityDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'City created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [city_dto_1.CreateCityDto]),
    __metadata("design:returntype", Promise)
], CityController.prototype, "create", null);
exports.CityController = CityController = __decorate([
    (0, common_1.Controller)('cities'),
    (0, swagger_1.ApiTags)('Cities'),
    __metadata("design:paramtypes", [CityRepository_1.CityRepository])
], CityController);
