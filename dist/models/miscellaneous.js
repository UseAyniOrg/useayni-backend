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
exports.Miscellaneous = exports.ActivityPriority = exports.ActivityStatus = exports.MiscellaneousScope = exports.MiscellaneousVisibility = exports.MiscellaneousParticipation = exports.MiscellaneousStatus = exports.MiscellaneousType = void 0;
const typeorm_1 = require("typeorm");
const member_1 = require("./member");
var MiscellaneousType;
(function (MiscellaneousType) {
    MiscellaneousType["PROJECT"] = "project";
    MiscellaneousType["EVENT"] = "event";
    MiscellaneousType["GOAL"] = "goal";
    MiscellaneousType["MEETING"] = "meeting";
    MiscellaneousType["ACTIVITY"] = "activity";
    MiscellaneousType["FORM"] = "form";
})(MiscellaneousType || (exports.MiscellaneousType = MiscellaneousType = {}));
var MiscellaneousStatus;
(function (MiscellaneousStatus) {
    MiscellaneousStatus["DRAFT"] = "draft";
    MiscellaneousStatus["PENDING_APPROVAL"] = "pending_approval";
    MiscellaneousStatus["UNDER_REVIEW"] = "under_review";
    MiscellaneousStatus["ACTIVE"] = "active";
    MiscellaneousStatus["REJECTED"] = "rejected";
    MiscellaneousStatus["ARCHIVED"] = "archived";
})(MiscellaneousStatus || (exports.MiscellaneousStatus = MiscellaneousStatus = {}));
var MiscellaneousParticipation;
(function (MiscellaneousParticipation) {
    MiscellaneousParticipation["PUBLIC"] = "public";
    MiscellaneousParticipation["PRIVATE"] = "private";
})(MiscellaneousParticipation || (exports.MiscellaneousParticipation = MiscellaneousParticipation = {}));
// kept for backward compat
exports.MiscellaneousVisibility = MiscellaneousParticipation;
var MiscellaneousScope;
(function (MiscellaneousScope) {
    MiscellaneousScope["INDIVIDUAL"] = "individual";
    MiscellaneousScope["SEMESTER"] = "semester";
    MiscellaneousScope["COURSE"] = "course";
    MiscellaneousScope["UNIVERSITY"] = "university";
    MiscellaneousScope["CITY"] = "city";
    MiscellaneousScope["CAR"] = "car";
    MiscellaneousScope["CAE"] = "cae";
    MiscellaneousScope["GENERAL"] = "general";
})(MiscellaneousScope || (exports.MiscellaneousScope = MiscellaneousScope = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["PENDING"] = "pending";
    ActivityStatus["IN_PROGRESS"] = "in_progress";
    ActivityStatus["DONE"] = "done";
    ActivityStatus["BLOCKED"] = "blocked";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
var ActivityPriority;
(function (ActivityPriority) {
    ActivityPriority["HIGH"] = "high";
    ActivityPriority["MEDIUM"] = "medium";
    ActivityPriority["LOW"] = "low";
})(ActivityPriority || (exports.ActivityPriority = ActivityPriority = {}));
let Miscellaneous = class Miscellaneous {
};
exports.Miscellaneous = Miscellaneous;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Miscellaneous.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 30, default: MiscellaneousStatus.DRAFT }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'public' }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "participation_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'public' }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Miscellaneous.prototype, "scope_rules", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "max_participants", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_zip", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_street", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_neighborhood", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_city", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "location_state", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "cover_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "banner_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true, unique: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "public_slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Miscellaneous.prototype, "public_access_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "stream_link", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "capacity_presential", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "capacity_online", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "meeting_link", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "agenda", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "goal_target", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "goal_unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "goal_progress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "activity_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "activity_priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "registration_start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "registration_end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Miscellaneous.prototype, "max_members", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Miscellaneous.prototype, "waitlist_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "waitlist_message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "parent_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Miscellaneous, m => m.children, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Miscellaneous)
], Miscellaneous.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Miscellaneous, m => m.parent),
    __metadata("design:type", Array)
], Miscellaneous.prototype, "children", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Miscellaneous.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => member_1.Member),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", member_1.Member)
], Miscellaneous.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], Miscellaneous.prototype, "deleted_at", void 0);
exports.Miscellaneous = Miscellaneous = __decorate([
    (0, typeorm_1.Entity)('miscellaneous')
], Miscellaneous);
