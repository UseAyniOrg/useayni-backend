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
exports.MemberCourse = exports.MemberCourseStatus = void 0;
const typeorm_1 = require("typeorm");
const member_1 = require("./member");
const courseUniversity_1 = require("./courseUniversity");
var MemberCourseStatus;
(function (MemberCourseStatus) {
    MemberCourseStatus["ACTIVE"] = "active";
    MemberCourseStatus["SUSPENDED"] = "suspended";
    MemberCourseStatus["COMPLETED"] = "completed";
    MemberCourseStatus["CANCELLED"] = "cancelled";
})(MemberCourseStatus || (exports.MemberCourseStatus = MemberCourseStatus = {}));
let MemberCourse = class MemberCourse {
};
exports.MemberCourse = MemberCourse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MemberCourse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MemberCourse.prototype, "member_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member, (member) => member.memberCourses),
    (0, typeorm_1.JoinColumn)({ name: "member_id" }),
    __metadata("design:type", member_1.Member)
], MemberCourse.prototype, "member", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], MemberCourse.prototype, "course_university_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => courseUniversity_1.CourseUniversity, (cu) => cu.memberCourses),
    (0, typeorm_1.JoinColumn)({ name: "course_university_id" }),
    __metadata("design:type", courseUniversity_1.CourseUniversity)
], MemberCourse.prototype, "courseUniversity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: MemberCourseStatus,
        default: MemberCourseStatus.ACTIVE,
    }),
    __metadata("design:type", String)
], MemberCourse.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], MemberCourse.prototype, "started_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date", nullable: true }),
    __metadata("design:type", Date)
], MemberCourse.prototype, "completed_at", void 0);
exports.MemberCourse = MemberCourse = __decorate([
    (0, typeorm_1.Entity)("member_courses")
], MemberCourse);
