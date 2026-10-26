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
exports.SubmitFormResponseDto = exports.FormAnswerDto = exports.ReorderQuestionsDto = exports.CreateFormQuestionDto = exports.FormOptionDto = exports.CreateFormDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const form_1 = require("../../models/form");
class CreateFormDto {
}
exports.CreateFormDto = CreateFormDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateFormDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFormDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFormDto.prototype, "anonymous", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['unlimited', 'once', 'limited']),
    __metadata("design:type", String)
], CreateFormDto.prototype, "response_limit_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateFormDto.prototype, "max_responses_per_user", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: form_1.ResultsVisibility }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(form_1.ResultsVisibility),
    __metadata("design:type", String)
], CreateFormDto.prototype, "results_visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateFormDto.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateFormDto.prototype, "end_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFormDto.prototype, "public_results_enabled", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateFormDto.prototype, "miscellaneous_id", void 0);
class FormOptionDto {
}
exports.FormOptionDto = FormOptionDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], FormOptionDto.prototype, "label", void 0);
class CreateFormQuestionDto {
}
exports.CreateFormQuestionDto = CreateFormQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: form_1.QuestionType }),
    (0, class_validator_1.IsEnum)(form_1.QuestionType),
    __metadata("design:type", String)
], CreateFormQuestionDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateFormQuestionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFormQuestionDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateFormQuestionDto.prototype, "required", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateFormQuestionDto.prototype, "scale_min", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateFormQuestionDto.prototype, "scale_max", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [FormOptionDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FormOptionDto),
    (0, class_validator_1.ArrayMinSize)(2),
    __metadata("design:type", Array)
], CreateFormQuestionDto.prototype, "options", void 0);
class ReorderQuestionsDto {
}
exports.ReorderQuestionsDto = ReorderQuestionsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], ReorderQuestionsDto.prototype, "question_ids", void 0);
class FormAnswerDto {
}
exports.FormAnswerDto = FormAnswerDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], FormAnswerDto.prototype, "question_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FormAnswerDto.prototype, "value", void 0);
class SubmitFormResponseDto {
}
exports.SubmitFormResponseDto = SubmitFormResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [FormAnswerDto] }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FormAnswerDto),
    __metadata("design:type", Array)
], SubmitFormResponseDto.prototype, "answers", void 0);
