"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaeRepository = void 0;
const db_1 = require("../db");
const cae_1 = require("../models/cae");
exports.CaeRepository = db_1.AppDataBase.getRepository(cae_1.Cae).extend({
    async findByStateId(stateId) {
        return this.find({
            where: { state_id: stateId },
            relations: ['state', 'managers', 'managers.member', 'cars'],
        });
    },
    async findWithManagers(id) {
        return this.findOne({
            where: { id },
            relations: ['state', 'managers', 'managers.member', 'cars'],
        });
    },
});
