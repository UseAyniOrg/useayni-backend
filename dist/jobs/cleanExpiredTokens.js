"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/jobs/cleanExpiredTokens.ts
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db");
const token_1 = require("../models/token");
const typeorm_1 = require("typeorm");
node_cron_1.default.schedule("0 * * * *", async () => {
    const tokenRepo = db_1.AppDataBase.getRepository(token_1.Token);
    const now = new Date();
    await tokenRepo.delete({
        expiresAt: (0, typeorm_1.LessThan)(now),
    });
    console.log(`[Job] Tokens expirados removidos às ${now.toISOString()}`);
});
