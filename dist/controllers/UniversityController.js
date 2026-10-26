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
exports.UniversityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const UniversityRepository_1 = require("../repositories/UniversityRepository");
const university_dto_1 = require("../dto/academic/university.dto");
const MecUniversitySyncService_1 = require("../services/MecUniversitySyncService");
const authorization_guard_1 = require("../middlewares/authorization.guard");
const permissionMiddleware_1 = require("../middlewares/permissionMiddleware");
let UniversityController = class UniversityController {
    constructor(universityRepository, mecUniversitySyncService) {
        this.universityRepository = universityRepository;
        this.mecUniversitySyncService = mecUniversitySyncService;
    }
    async syncFromMec(includeInactive, limit) {
        return this.mecUniversitySyncService.syncFromMecCsv({
            includeInactive: includeInactive === 'true',
            limit: limit ? Number(limit) : undefined,
        });
    }
    async findAll(cityId, city_id, stateId, state_id, stateUf, q) {
        cityId = cityId || city_id;
        stateId = stateId || state_id;
        return this.universityRepository.findAll({
            cityId,
            stateId: stateId && stateId.length !== 2 ? stateId : undefined,
            stateUf: stateUf || (stateId?.length === 2 ? stateId : undefined),
            q,
        });
    }
    async findById(id) {
        return this.universityRepository.findById(id);
    }
    async getCourses(id) {
        const university = await this.universityRepository.findById(id);
        return university?.courseUniversities?.map((courseUniversity) => ({
            id: courseUniversity.course.id,
            name: courseUniversity.course.name,
            course_university_id: courseUniversity.id,
        })) || [];
    }
    async create(data) {
        return this.universityRepository.create(data);
    }
};
exports.UniversityController = UniversityController;
__decorate([
    (0, common_1.Post)('sync/mec'),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, permissionMiddleware_1.Roles)('EQUIPE_TECNICA'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Sync universities from MEC/e-MEC open data CSV' }),
    (0, swagger_1.ApiQuery)({
        name: 'includeInactive',
        required: false,
        type: Boolean,
        description: 'Import inactive/extinct institutions too. Defaults to false.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number,
        description: 'Optional row limit for testing the import routine.',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'MEC universities synchronized' }),
    __param(0, (0, common_1.Query)('includeInactive')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "syncFromMec", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all universities' }),
    (0, swagger_1.ApiQuery)({ name: 'cityId', required: false, description: 'Filter by city ID' }),
    (0, swagger_1.ApiQuery)({ name: 'city_id', required: false, description: 'Filter by city ID' }),
    (0, swagger_1.ApiQuery)({ name: 'stateId', required: false, description: 'Filter by state ID or UF' }),
    (0, swagger_1.ApiQuery)({ name: 'state_id', required: false, description: 'Filter by state ID or UF' }),
    (0, swagger_1.ApiQuery)({ name: 'stateUf', required: false, description: 'Filter by state UF' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: false, description: 'Search by name or acronym' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of universities' }),
    __param(0, (0, common_1.Query)('cityId')),
    __param(1, (0, common_1.Query)('city_id')),
    __param(2, (0, common_1.Query)('stateId')),
    __param(3, (0, common_1.Query)('state_id')),
    __param(4, (0, common_1.Query)('stateUf')),
    __param(5, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get university by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'University ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'University found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'University not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "findById", null);
__decorate([
    (0, common_1.Get)(':id/courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get courses by university' }),
    (0, swagger_1.ApiParam)({ name: 'id', type: String, description: 'University ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of courses' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "getCourses", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(authorization_guard_1.AuthorizationGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create university' }),
    (0, swagger_1.ApiBody)({ type: university_dto_1.CreateUniversityDto }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'University created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [university_dto_1.CreateUniversityDto]),
    __metadata("design:returntype", Promise)
], UniversityController.prototype, "create", null);
exports.UniversityController = UniversityController = __decorate([
    (0, common_1.Controller)('universities'),
    (0, swagger_1.ApiTags)('Universities'),
    __metadata("design:paramtypes", [UniversityRepository_1.UniversityRepository,
        MecUniversitySyncService_1.MecUniversitySyncService])
], UniversityController);
