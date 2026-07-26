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
exports.CreateMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateMemberDto {
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Joao', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "first_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Silva', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "last_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Joao Silva', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '12345678900' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "confirm_password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11999999999' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email_personal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@university.edu' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email_university", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1234567890' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "ra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2000-01-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-estado', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "state_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PR', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "state_uf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-cidade', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "city_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '4106902', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "city_ibge_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Curitiba', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "city_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-universidade', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "university_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '588', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "university_emec_code", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Universidade Tecnologica Federal do Parana', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "university_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'UTFPR', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "university_acronym", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMemberDto.prototype, "university_not_applicable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-curso', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "course_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Engenharia de Software', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "course_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMemberDto.prototype, "course_not_applicable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMemberDto.prototype, "current_semester", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMemberDto.prototype, "current_semester_not_applicable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-do-vinculo-curso-universidade',
        description: 'Optional relation to a course university record',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "course_university_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-01-01' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "admission_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Membro', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b314b18f-26d6-4f97-9ed2-1f3942f8b787', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "sponsor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Biografia do membro', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "biography", void 0);
