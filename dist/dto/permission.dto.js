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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePermissionDto = exports.CreatePermissionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePermissionDto {
}
exports.CreatePermissionDto = CreatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'CREATE_PROJECTS',
        description: 'Nome único da permissão (em MAIÚSCULAS)'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Criar novos projetos',
        description: 'Descrição da permissão',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'projects',
        description: 'Recurso ao qual a permissão se aplica (ex: members, projects, reports)'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'create',
        description: 'Ação permitida (ex: read, create, update, delete, manage)'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePermissionDto.prototype, "action", void 0);
class UpdatePermissionDto {
}
exports.UpdatePermissionDto = UpdatePermissionDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'CREATE_PROJECTS',
        description: 'Nome da permissão',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Criar e gerenciar projetos',
        description: 'Descrição da permissão',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'projects',
        description: 'Recurso',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'manage',
        description: 'Ação',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionDto.prototype, "action", void 0);
