"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenRepository = void 0;
const common_1 = require("@nestjs/common");
const db_1 = require("../db");
const token_1 = require("../models/token");
let TokenRepository = class TokenRepository {
    constructor() {
        this.repository = db_1.AppDataBase.getRepository(token_1.Token);
    }
    async findByToken(token) {
        return this.repository.findOne({ where: { token } });
    }
    async deleteByMemberId(memberId) {
        return this.repository.delete({ memberId });
    }
    async deleteByMemberIdAndType(memberId, type) {
        return this.repository.delete({ memberId, type });
    }
    async deleteByToken(token) {
        return this.repository.delete({ token });
    }
    async save(tokenData) {
        return this.repository.save(tokenData);
    }
};
exports.TokenRepository = TokenRepository;
exports.TokenRepository = TokenRepository = __decorate([
    (0, common_1.Injectable)()
], TokenRepository);
