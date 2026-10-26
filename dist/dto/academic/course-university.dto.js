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
exports.CreateEnrollmentDto = exports.CreateSemesterOfferingDto = exports.CreateAcademicTermDto = exports.CreateProgramSemesterDto = exports.LinkCourseUniversityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class LinkCourseUniversityDto {
}
exports.LinkCourseUniversityDto = LinkCourseUniversityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-curso', description: 'ID do curso' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkCourseUniversityDto.prototype, "courseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-universidade', description: 'ID da universidade' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkCourseUniversityDto.prototype, "universityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-da-cidade', description: 'ID da cidade' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LinkCourseUniversityDto.prototype, "cityId", void 0);
class CreateProgramSemesterDto {
}
exports.CreateProgramSemesterDto = CreateProgramSemesterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-curso', description: 'ID do curso' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProgramSemesterDto.prototype, "courseId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Número do semestre' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateProgramSemesterDto.prototype, "semester_number", void 0);
class CreateAcademicTermDto {
}
exports.CreateAcademicTermDto = CreateAcademicTermDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2024, description: 'Ano' }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateAcademicTermDto.prototype, "year", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1S', description: 'Período (1S, 2S, etc)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAcademicTermDto.prototype, "term", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-02-01', description: 'Data de início', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAcademicTermDto.prototype, "starts_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-06-30', description: 'Data de término', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAcademicTermDto.prototype, "ends_at", void 0);
class CreateSemesterOfferingDto {
}
exports.CreateSemesterOfferingDto = CreateSemesterOfferingDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-course-university', description: 'ID do vínculo curso-universidade' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSemesterOfferingDto.prototype, "course_university_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-program-semester', description: 'ID do semestre do programa' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSemesterOfferingDto.prototype, "program_semester_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-academic-term', description: 'ID do período acadêmico' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateSemesterOfferingDto.prototype, "academic_term_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'planned', description: 'Status', enum: ['planned', 'active', 'closed', 'cancelled'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['planned', 'active', 'closed', 'cancelled']),
    __metadata("design:type", String)
], CreateSemesterOfferingDto.prototype, "status", void 0);
class CreateEnrollmentDto {
}
exports.CreateEnrollmentDto = CreateEnrollmentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-membro', description: 'ID do membro' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEnrollmentDto.prototype, "member_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-do-semester-offering', description: 'ID da oferta de semestre' }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateEnrollmentDto.prototype, "semester_offering_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'active', description: 'Status', enum: ['active', 'approved', 'failed', 'suspended', 'cancelled'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['active', 'approved', 'failed', 'suspended', 'cancelled']),
    __metadata("design:type", String)
], CreateEnrollmentDto.prototype, "status", void 0);
