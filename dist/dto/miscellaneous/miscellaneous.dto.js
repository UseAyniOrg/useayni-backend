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
exports.MiscellaneousFiltersDto = exports.UpdateMiscellaneousDto = exports.CreateMiscellaneousDto = exports.ScopeRuleDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const miscellaneous_1 = require("../../models/miscellaneous");
class ScopeRuleDto {
}
exports.ScopeRuleDto = ScopeRuleDto;
__decorate([
    (0, class_validator_1.IsIn)(['general', 'cae', 'car', 'city', 'university', 'course', 'semester']),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "cae_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "car_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "city_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "university_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ScopeRuleDto.prototype, "course_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ScopeRuleDto.prototype, "semester", void 0);
class CreateMiscellaneousDto {
}
exports.CreateMiscellaneousDto = CreateMiscellaneousDto;
__decorate([
    (0, swagger_1.ApiProperty)({ maxLength: 120 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: miscellaneous_1.MiscellaneousType }),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousType),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'public = free join, private = request-based' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['public', 'private']),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "participation_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [ScopeRuleDto], description: 'Scope rules (OR-combined)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScopeRuleDto),
    __metadata("design:type", Array)
], CreateMiscellaneousDto.prototype, "scope_rules", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMiscellaneousDto.prototype, "max_participants", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "parent_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_zip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_street", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_neighborhood", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "location_state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "cover_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "banner_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "stream_link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMiscellaneousDto.prototype, "capacity_presential", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateMiscellaneousDto.prototype, "capacity_online", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "meeting_link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "agenda", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateMiscellaneousDto.prototype, "goal_target", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "goal_unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.ActivityStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.ActivityStatus),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "activity_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.ActivityPriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.ActivityPriority),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "activity_priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "registration_start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "registration_end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateMiscellaneousDto.prototype, "max_members", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMiscellaneousDto.prototype, "waitlist_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMiscellaneousDto.prototype, "waitlist_message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateMiscellaneousDto.prototype, "co_owner_ids", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], CreateMiscellaneousDto.prototype, "initial_member_ids", void 0);
class UpdateMiscellaneousDto {
}
exports.UpdateMiscellaneousDto = UpdateMiscellaneousDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ maxLength: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.MiscellaneousParticipation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousParticipation),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.MiscellaneousScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousScope),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "parent_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_zip", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_street", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_neighborhood", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_city", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "location_state", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "cover_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "banner_url", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "stream_link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateMiscellaneousDto.prototype, "capacity_presential", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateMiscellaneousDto.prototype, "capacity_online", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "meeting_link", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "agenda", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMiscellaneousDto.prototype, "goal_target", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "goal_unit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateMiscellaneousDto.prototype, "goal_progress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.ActivityStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.ActivityStatus),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "activity_status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.ActivityPriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.ActivityPriority),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "activity_priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "registration_start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "registration_end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateMiscellaneousDto.prototype, "max_members", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMiscellaneousDto.prototype, "waitlist_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMiscellaneousDto.prototype, "waitlist_message", void 0);
class MiscellaneousFiltersDto {
}
exports.MiscellaneousFiltersDto = MiscellaneousFiltersDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.MiscellaneousType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousType),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.MiscellaneousParticipation }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousParticipation),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: miscellaneous_1.MiscellaneousScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(miscellaneous_1.MiscellaneousScope),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'owner | participant | creator' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "myRole", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MiscellaneousFiltersDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MiscellaneousFiltersDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MiscellaneousFiltersDto.prototype, "limit", void 0);
