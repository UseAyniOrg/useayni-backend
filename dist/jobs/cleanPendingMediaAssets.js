"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const db_1 = require("../db");
const MediaAssetService_1 = require("../services/MediaAssetService");
node_cron_1.default.schedule('15 * * * *', async () => {
    if (!db_1.AppDataBase.isInitialized)
        return;
    const service = new MediaAssetService_1.MediaAssetService();
    try {
        await service.cleanupAbandonedUploads();
    }
    catch (error) {
        console.error('[Media cleanup] Falha ao limpar uploads abandonados.', error);
    }
});
