"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const db_1 = require("../db");
const MecCourseSyncService_1 = require("../services/MecCourseSyncService");
function getArgValue(name) {
    const prefix = `--${name}=`;
    const arg = process.argv.find((value) => value.startsWith(prefix));
    return arg?.slice(prefix.length);
}
async function main() {
    await db_1.AppDataBase.initialize();
    const syncService = new MecCourseSyncService_1.MecCourseSyncService();
    const startedAt = Date.now();
    const progressEvery = getArgValue('progress-every')
        ? Number(getArgValue('progress-every'))
        : 10000;
    const result = await syncService.syncFromMecCsv({
        sourceFile: getArgValue('source-file') || '',
        limit: getArgValue('limit') ? Number(getArgValue('limit')) : undefined,
        batchSize: getArgValue('batch-size') ? Number(getArgValue('batch-size')) : undefined,
        progressEvery,
        onProgress: (progress) => printProgress(progress, startedAt),
    });
    process.stdout.write('\n');
    console.log('Sincronizacao de cursos MEC concluida:');
    console.table(result);
    await db_1.AppDataBase.destroy();
}
main().catch(async (error) => {
    console.error('Erro ao sincronizar cursos MEC:', error);
    if (db_1.AppDataBase.isInitialized) {
        await db_1.AppDataBase.destroy();
    }
    process.exit(1);
});
function printProgress(progress, startedAt) {
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    const rowsPerSecond = Math.round(progress.totalRows / elapsedSeconds);
    const message = [
        `Linhas lidas: ${formatNumber(progress.totalRows)}`,
        `processadas: ${formatNumber(progress.processedRows)}`,
        `ignoradas: ${formatNumber(progress.skippedRows)}`,
        `vinculos: ${formatNumber(progress.courseUniversitiesUpserted)}`,
        `cursos novos: ${formatNumber(progress.coursesCreated)}`,
        `${formatNumber(rowsPerSecond)} linhas/s`,
        `tempo: ${formatDuration(elapsedSeconds)}`,
    ].join(' | ');
    process.stdout.write(`\r${message.padEnd(140, ' ')}`);
}
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR').format(value);
}
function formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
