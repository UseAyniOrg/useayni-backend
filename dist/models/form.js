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
exports.FormAnswer = exports.FormResponse = exports.FormOption = exports.FormQuestion = exports.Form = exports.ResultsVisibility = exports.QuestionType = void 0;
const typeorm_1 = require("typeorm");
const miscellaneous_1 = require("./miscellaneous");
const member_1 = require("./member");
var QuestionType;
(function (QuestionType) {
    QuestionType["TEXT"] = "text";
    QuestionType["LONG_TEXT"] = "long_text";
    QuestionType["SINGLE"] = "single";
    QuestionType["MULTIPLE"] = "multiple";
    QuestionType["SELECT"] = "select";
    QuestionType["SCALE"] = "scale";
    QuestionType["DATE"] = "date";
    QuestionType["YES_NO"] = "yes_no";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
var ResultsVisibility;
(function (ResultsVisibility) {
    ResultsVisibility["OWNER"] = "owner";
    ResultsVisibility["MEMBERS"] = "members";
    ResultsVisibility["PUBLIC"] = "public";
})(ResultsVisibility || (exports.ResultsVisibility = ResultsVisibility = {}));
let Form = class Form {
};
exports.Form = Form;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Form.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Form.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Form.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Form.prototype, "anonymous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'unlimited' }),
    __metadata("design:type", String)
], Form.prototype, "response_limit_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Form.prototype, "max_responses_per_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: ResultsVisibility.OWNER }),
    __metadata("design:type", String)
], Form.prototype, "results_visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Form.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Form.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Form.prototype, "public_results_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, unique: true }),
    __metadata("design:type", String)
], Form.prototype, "public_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Form.prototype, "miscellaneous_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => miscellaneous_1.Miscellaneous, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'miscellaneous_id' }),
    __metadata("design:type", miscellaneous_1.Miscellaneous)
], Form.prototype, "miscellaneous", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Form.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", member_1.Member)
], Form.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FormQuestion, (q) => q.form),
    __metadata("design:type", Array)
], Form.prototype, "questions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Form.prototype, "created_at", void 0);
exports.Form = Form = __decorate([
    (0, typeorm_1.Entity)('forms')
], Form);
let FormQuestion = class FormQuestion {
};
exports.FormQuestion = FormQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FormQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FormQuestion.prototype, "form_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Form, (f) => f.questions),
    (0, typeorm_1.JoinColumn)({ name: 'form_id' }),
    __metadata("design:type", Form)
], FormQuestion.prototype, "form", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], FormQuestion.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FormQuestion.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FormQuestion.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], FormQuestion.prototype, "required", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], FormQuestion.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], FormQuestion.prototype, "scale_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], FormQuestion.prototype, "scale_max", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FormOption, (o) => o.question),
    __metadata("design:type", Array)
], FormQuestion.prototype, "options", void 0);
exports.FormQuestion = FormQuestion = __decorate([
    (0, typeorm_1.Entity)('form_questions')
], FormQuestion);
let FormOption = class FormOption {
};
exports.FormOption = FormOption;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FormOption.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FormOption.prototype, "question_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FormQuestion, (q) => q.options),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", FormQuestion)
], FormOption.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], FormOption.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], FormOption.prototype, "position", void 0);
exports.FormOption = FormOption = __decorate([
    (0, typeorm_1.Entity)('form_options')
], FormOption);
let FormResponse = class FormResponse {
};
exports.FormResponse = FormResponse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FormResponse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FormResponse.prototype, "form_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Form),
    (0, typeorm_1.JoinColumn)({ name: 'form_id' }),
    __metadata("design:type", Form)
], FormResponse.prototype, "form", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], FormResponse.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'member_id' }),
    __metadata("design:type", member_1.Member)
], FormResponse.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => FormAnswer, (a) => a.response),
    __metadata("design:type", Array)
], FormResponse.prototype, "answers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], FormResponse.prototype, "submitted_at", void 0);
exports.FormResponse = FormResponse = __decorate([
    (0, typeorm_1.Entity)('form_responses')
], FormResponse);
let FormAnswer = class FormAnswer {
};
exports.FormAnswer = FormAnswer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], FormAnswer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FormAnswer.prototype, "response_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FormResponse, (r) => r.answers),
    (0, typeorm_1.JoinColumn)({ name: 'response_id' }),
    __metadata("design:type", FormResponse)
], FormAnswer.prototype, "response", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], FormAnswer.prototype, "question_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => FormQuestion),
    (0, typeorm_1.JoinColumn)({ name: 'question_id' }),
    __metadata("design:type", FormQuestion)
], FormAnswer.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], FormAnswer.prototype, "value", void 0);
exports.FormAnswer = FormAnswer = __decorate([
    (0, typeorm_1.Entity)('form_answers')
], FormAnswer);
