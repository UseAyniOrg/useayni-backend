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
exports.AssignRoleToMemberDto = exports.AssignPermissionsDto = exports.UpdateRoleDto = exports.CreateRoleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateRoleDto {
}
exports.CreateRoleDto = CreateRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'COORDENADOR',
        description: 'Nome da role (deve ser único e em MAIÚSCULAS)'
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Coordenador de projetos',
        description: 'Descrição da role',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRoleDto.prototype, "description", void 0);
class UpdateRoleDto {
}
exports.UpdateRoleDto = UpdateRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'COORDENADOR',
        description: 'Nome da role',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Coordenador de projetos e eventos',
        description: 'Descrição da role',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "description", void 0);
class AssignPermissionsDto {
}
exports.AssignPermissionsDto = AssignPermissionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['uuid-permission-1', 'uuid-permission-2'],
        description: 'Array de IDs das permissões',
        type: [String]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], AssignPermissionsDto.prototype, "permissionIds", void 0);
class AssignRoleToMemberDto {
}
exports.AssignRoleToMemberDto = AssignRoleToMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-do-membro',
        description: 'ID do membro'
    }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignRoleToMemberDto.prototype, "memberId", void 0);
