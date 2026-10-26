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
exports.ManualCheckInDto = exports.CreateAttendanceSessionDto = exports.ApprovalActionDto = exports.RejectInviteDto = exports.CreateInviteDto = exports.ReviewRequestDto = exports.CreateRequestDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const attendance_1 = require("../../models/attendance");
class CreateRequestDto {
}
exports.CreateRequestDto = CreateRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 255 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRequestDto.prototype, "message", void 0);
class ReviewRequestDto {
}
exports.ReviewRequestDto = ReviewRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['approved', 'rejected'] }),
    (0, class_validator_1.IsEnum)(['approved', 'rejected']),
    __metadata("design:type", String)
], ReviewRequestDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewRequestDto.prototype, "response_message", void 0);
class CreateInviteDto {
}
exports.CreateInviteDto = CreateInviteDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateInviteDto.prototype, "invited_user_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInviteDto.prototype, "message", void 0);
class RejectInviteDto {
}
exports.RejectInviteDto = RejectInviteDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectInviteDto.prototype, "rejection_reason", void 0);
class ApprovalActionDto {
}
exports.ApprovalActionDto = ApprovalActionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApprovalActionDto.prototype, "comment", void 0);
class CreateAttendanceSessionDto {
}
exports.CreateAttendanceSessionDto = CreateAttendanceSessionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: attendance_1.AttendanceMode }),
    (0, class_validator_1.IsEnum)(attendance_1.AttendanceMode),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "mode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "starts_at", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "ends_at", void 0);
class ManualCheckInDto {
}
exports.ManualCheckInDto = ManualCheckInDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], ManualCheckInDto.prototype, "present", void 0);
