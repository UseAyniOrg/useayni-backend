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
exports.UpdateMemberDto = exports.CreateMemberDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateMemberDto {
}
exports.CreateMemberDto = CreateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "João Silva" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "12345678900" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "password123" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "11999999999" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "joao@example.com" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email_personal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "joao@university.edu" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "email_university", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "1234567890" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "ra", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2000-01-01" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "birth_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Universidade Federal" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "university", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Engenharia de Software" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "course", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Campus Central" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "campus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "2024-01-01" }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "admission_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Membro", required: false }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "position", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "sponsor-uuid", required: false }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "sponsor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Biografia do membro", required: false }),
    __metadata("design:type", String)
], CreateMemberDto.prototype, "biography", void 0);
class UpdateMemberDto {
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "João Silva", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "11999999999", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Biografia atualizada", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "biography", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://example.com/profile.jpg", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "profile_picture_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://example.com/banner.jpg", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "banner_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://linkedin.com/in/user", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "linkedin_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "https://github.com/user", required: false }),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "github_url", void 0);
