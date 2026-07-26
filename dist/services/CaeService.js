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
exports.CaeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const CaeRepository_1 = require("../repositories/CaeRepository");
const CaeManagerRepository_1 = require("../repositories/CaeManagerRepository");
let CaeService = class CaeService {
    constructor() { }
    async findAll() {
        return CaeRepository_1.CaeRepository.find({
            relations: ['state', 'managers', 'managers.member', 'cars'],
        });
    }
    async findById(id) {
        return CaeRepository_1.CaeRepository.findWithManagers(id);
    }
    async findByStateId(stateId) {
        return CaeRepository_1.CaeRepository.findByStateId(stateId);
    }
    async create(data) {
        const cae = CaeRepository_1.CaeRepository.create(data);
        return CaeRepository_1.CaeRepository.save(cae);
    }
    async update(id, data) {
        await CaeRepository_1.CaeRepository.update(id, data);
        return this.findById(id);
    }
    async delete(id) {
        await CaeRepository_1.CaeRepository.softDelete(id);
    }
    async addManager(caeId, memberId, startDate) {
        const manager = CaeManagerRepository_1.CaeManagerRepository.create({
            cae_id: caeId,
            member_id: memberId,
            start_date: startDate || new Date(),
        });
        return CaeManagerRepository_1.CaeManagerRepository.save(manager);
    }
    async removeManager(caeId, memberId) {
        const manager = await CaeManagerRepository_1.CaeManagerRepository.findOne({
            where: { cae_id: caeId, member_id: memberId, end_date: (0, typeorm_1.IsNull)() },
        });
        if (manager) {
            manager.end_date = new Date();
            await CaeManagerRepository_1.CaeManagerRepository.save(manager);
        }
    }
    async getManagers(caeId) {
        return CaeManagerRepository_1.CaeManagerRepository.findByCaeId(caeId);
    }
    async isManager(memberId, caeId) {
        return CaeManagerRepository_1.CaeManagerRepository.isManager(memberId, caeId);
    }
};
exports.CaeService = CaeService;
exports.CaeService = CaeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CaeService);
