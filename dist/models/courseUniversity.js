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
exports.CourseUniversity = void 0;
const typeorm_1 = require("typeorm");
const course_1 = require("./course");
const university_1 = require("./university");
const city_1 = require("./city");
const memberCourse_1 = require("./memberCourse");
let CourseUniversity = class CourseUniversity {
};
exports.CourseUniversity = CourseUniversity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], CourseUniversity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CourseUniversity.prototype, "course_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => course_1.Course, (course) => course.courseUniversities),
    (0, typeorm_1.JoinColumn)({ name: "course_id" }),
    __metadata("design:type", course_1.Course)
], CourseUniversity.prototype, "course", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CourseUniversity.prototype, "university_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => university_1.University, (univ) => univ.courseUniversities),
    (0, typeorm_1.JoinColumn)({ name: "university_id" }),
    __metadata("design:type", university_1.University)
], CourseUniversity.prototype, "university", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], CourseUniversity.prototype, "city_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => city_1.City, (city) => city.courseUniversities),
    (0, typeorm_1.JoinColumn)({ name: "city_id" }),
    __metadata("design:type", city_1.City)
], CourseUniversity.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], CourseUniversity.prototype, "external_course_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 50, nullable: true }),
    __metadata("design:type", Object)
], CourseUniversity.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], CourseUniversity.prototype, "degree_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], CourseUniversity.prototype, "modality", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", Object)
], CourseUniversity.prototype, "academic_level", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => memberCourse_1.MemberCourse, (mc) => mc.courseUniversity),
    __metadata("design:type", Array)
], CourseUniversity.prototype, "memberCourses", void 0);
exports.CourseUniversity = CourseUniversity = __decorate([
    (0, typeorm_1.Entity)("course_universities")
], CourseUniversity);
