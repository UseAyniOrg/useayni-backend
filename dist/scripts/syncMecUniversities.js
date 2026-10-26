"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const db_1 = require("../db");
const MecUniversitySyncService_1 = require("../services/MecUniversitySyncService");
function getArgValue(name) {
    const prefix = `--${name}=`;
    const arg = process.argv.find((value) => value.startsWith(prefix));
    return arg?.slice(prefix.length);
}
async function main() {
    await db_1.AppDataBase.initialize();
    const syncService = new MecUniversitySyncService_1.MecUniversitySyncService();
    const result = await syncService.syncFromMecCsv({
        includeInactive: process.argv.includes('--include-inactive'),
        limit: getArgValue('limit') ? Number(getArgValue('limit')) : undefined,
        sourceUrl: getArgValue('source-url'),
        sourceFile: getArgValue('source-file'),
    });
    console.log('Sincronizacao de universidades MEC concluida:');
    console.table(result);
    await db_1.AppDataBase.destroy();
}
main().catch(async (error) => {
    console.error('Erro ao sincronizar universidades MEC:', error);
    if (db_1.AppDataBase.isInitialized) {
        await db_1.AppDataBase.destroy();
    }
    process.exit(1);
});
