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
exports.Member = exports.MemberRegistrationStatus = void 0;
const typeorm_1 = require("typeorm");
const role_1 = require("./role");
const city_1 = require("./city");
const car_1 = require("./car");
const memberCourse_1 = require("./memberCourse");
var MemberRegistrationStatus;
(function (MemberRegistrationStatus) {
    MemberRegistrationStatus["PENDING"] = "pending";
    MemberRegistrationStatus["APPROVED"] = "approved";
    MemberRegistrationStatus["REJECTED"] = "rejected";
})(MemberRegistrationStatus || (exports.MemberRegistrationStatus = MemberRegistrationStatus = {}));
let Member = class Member {
};
exports.Member = Member;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Member.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Member.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 14, unique: true, select: false }),
    __metadata("design:type", String)
], Member.prototype, "cpf", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, select: false }),
    __metadata("design:type", String)
], Member.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Member.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "email_personal", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "email_university", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, unique: true }),
    __metadata("design:type", String)
], Member.prototype, "ra", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "profile_picture_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Member.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => memberCourse_1.MemberCourse, (mc) => mc.member),
    __metadata("design:type", Array)
], Member.prototype, "memberCourses", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "city_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => city_1.City, (city) => city.members),
    (0, typeorm_1.JoinColumn)({ name: "city_id" }),
    __metadata("design:type", city_1.City)
], Member.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], Member.prototype, "admission_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "current_semester", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Member.prototype, "university_not_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Member.prototype, "course_not_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Member.prototype, "current_semester_not_applicable", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 20,
        default: MemberRegistrationStatus.PENDING,
    }),
    __metadata("design:type", String)
], Member.prototype, "registration_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "registration_reviewed_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Member),
    (0, typeorm_1.JoinColumn)({ name: "registration_reviewed_by" }),
    __metadata("design:type", Member)
], Member.prototype, "registrationReviewer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp with time zone", nullable: true }),
    __metadata("design:type", Date)
], Member.prototype, "registration_reviewed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "registration_rejection_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", Object)
], Member.prototype, "sponsor", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => role_1.Role, (role) => role.members),
    (0, typeorm_1.JoinTable)({
        name: "member_roles",
        joinColumn: { name: "member_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "role_id", referencedColumnName: "id" },
    }),
    __metadata("design:type", Array)
], Member.prototype, "roles", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => car_1.Car, (car) => car.managers),
    __metadata("design:type", Array)
], Member.prototype, "managedCars", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "biography", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "banner_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "curriculum_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "youtube_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "twitter_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "instagram_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "linkedin_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "github_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Member.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 20,
        default: "PENDING"
    }),
    __metadata("design:type", String)
], Member.prototype, "status", void 0);
exports.Member = Member = __decorate([
    (0, typeorm_1.Entity)("members")
], Member);
