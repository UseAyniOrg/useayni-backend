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
exports.CourseManager = void 0;
const typeorm_1 = require("typeorm");
const courseUniversity_1 = require("./courseUniversity");
const member_1 = require("./member");
let CourseManager = class CourseManager {
};
exports.CourseManager = CourseManager;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CourseManager.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CourseManager.prototype, "course_university_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => courseUniversity_1.CourseUniversity),
    (0, typeorm_1.JoinColumn)({ name: "course_university_id" }),
    __metadata("design:type", courseUniversity_1.CourseUniversity)
], CourseManager.prototype, "courseUniversity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CourseManager.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", member_1.Member)
], CourseManager.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], CourseManager.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], CourseManager.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CourseManager.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CourseManager.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], CourseManager.prototype, "deleted_at", void 0);
exports.CourseManager = CourseManager = __decorate([
    (0, typeorm_1.Entity)("course_managers")
], CourseManager);
