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
exports.CarController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const CarService_1 = require("../services/CarService");
const car_dto_1 = require("../dto/car/car.dto");
const authorization_guard_1 = require("../middlewares/authorization.guard");
let CarController = class CarController {
    constructor(carService) {
        this.carService = carService;
    }
    async findAll() {
        return this.carService.findAll();
    }
    async findById(id) {
        return this.carService.findById(id);
    }
    async getMembers(id) {
        return this.carService.getMembersByCar(id);
    }
    async create(data) {
        return this.carService.create(data);
    }
    async addManager(carId, data) {
        return this.carService.assignManagerToCar(carId, data.memberId);
    }
    async removeManager(carId, memberId) {
        await this.carService.removeManagerFromCar(carId, memberId);
        return { message: 'Manager removed successfully' };
    }
    async addCities(carId, data) {
        return this.carService.assignCitiesToCar(carId, data.cityIds);
    }
    async removeCities(carId, data) {
        await this.carService.removeCitiesFromCar(carId, data.cityIds);
        return { message: 'Cities removed successfully' };
    }
};
exports.CarController = CarController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all CARs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of CARs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CarController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get CAR by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'CAR found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'CAR not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get members by CAR', description: 'Returns all members living in cities covered by this CAR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of members' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create CAR' }),
    (0, swagger_1.ApiBody)({ type: car_dto_1.CreateCarDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'CAR created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [car_dto_1.CreateCarDto]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/managers'),
    (0, swagger_1.ApiOperation)({ summary: 'Add manager to CAR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiBody)({ type: car_dto_1.AddManagerDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Manager added' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'CAR or member not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, car_dto_1.AddManagerDto]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "addManager", null);
__decorate([
    (0, common_1.Delete)(':id/managers/:memberId'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Remove manager from CAR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', type: String, description: 'Member ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Manager removed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "removeManager", null);
__decorate([
    (0, common_1.Post)(':id/cities'),
    (0, swagger_1.ApiOperation)({ summary: 'Add cities to CAR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiBody)({ type: car_dto_1.ManageCitiesDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cities added' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'CAR not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, car_dto_1.ManageCitiesDto]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "addCities", null);
__decorate([
    (0, common_1.Delete)(':id/cities'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Remove cities from CAR' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'CAR ID' }),
    (0, swagger_1.ApiBody)({ type: car_dto_1.ManageCitiesDto }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cities removed' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, car_dto_1.ManageCitiesDto]),
    __metadata("design:returntype", Promise)
], CarController.prototype, "removeCities", null);
exports.CarController = CarController = __decorate([
    (0, common_1.Controller)('cars'),
    (0, swagger_1.ApiTags)('CARs'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [CarService_1.CarService])
], CarController);
