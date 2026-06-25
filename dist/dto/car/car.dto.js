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
exports.ManageCitiesDto = exports.AddManagerDto = exports.CreateCarDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCarDto {
}
exports.CreateCarDto = CreateCarDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'CAR São Paulo Capital', description: 'Nome da CAR' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'Atende região metropolitana de São Paulo',
        description: 'Descrição da CAR',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCarDto.prototype, "description", void 0);
class AddManagerDto {
}
exports.AddManagerDto = AddManagerDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-membro', description: 'ID do membro gestor' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddManagerDto.prototype, "memberId", void 0);
class ManageCitiesDto {
}
exports.ManageCitiesDto = ManageCitiesDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: ['uuid-cidade-1', 'uuid-cidade-2'],
        description: 'Array de IDs das cidades',
        type: [String]
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ManageCitiesDto.prototype, "cityIds", void 0);
