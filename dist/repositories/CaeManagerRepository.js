"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaeManagerRepository = void 0;
const typeorm_1 = require("typeorm");
const db_1 = require("../db");
const caeManager_1 = require("../models/caeManager");
exports.CaeManagerRepository = db_1.AppDataBase.getRepository(caeManager_1.CaeManager).extend({
    async findByMemberId(memberId) {
        return this.find({
            where: {
                member_id: memberId,
                end_date: (0, typeorm_1.IsNull)(),
            },
            relations: ['cae', 'cae.state'],
        });
    },
    async findByCaeId(caeId) {
        return this.find({
            where: { cae_id: caeId },
            relations: ['member'],
        });
    },
    async isManager(memberId, caeId) {
        const count = await this.count({
            where: {
                member_id: memberId,
                cae_id: caeId,
                end_date: (0, typeorm_1.IsNull)(),
            },
        });
        return count > 0;
    },
});
