import 'reflect-metadata';
import { AppDataBase } from '../db';
import { MecUniversitySyncService } from '../services/MecUniversitySyncService';

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg?.slice(prefix.length);
}

async function main() {
  await AppDataBase.initialize();

  const syncService = new MecUniversitySyncService();
  const result = await syncService.syncFromMecCsv({
    includeInactive: process.argv.includes('--include-inactive'),
    limit: getArgValue('limit') ? Number(getArgValue('limit')) : undefined,
    sourceUrl: getArgValue('source-url'),
    sourceFile: getArgValue('source-file'),
  });

  console.log('Sincronizacao de universidades MEC concluida:');
  console.table(result);

  await AppDataBase.destroy();
}

main().catch(async (error) => {
  console.error('Erro ao sincronizar universidades MEC:', error);
  if (AppDataBase.isInitialized) {
    await AppDataBase.destroy();
  }
  process.exit(1);
});
