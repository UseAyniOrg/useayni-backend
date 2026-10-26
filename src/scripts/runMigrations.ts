import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataBase } from '../db';

async function main() {
  await AppDataBase.initialize();
  try {
    const migrations = await AppDataBase.runMigrations();
    console.log(`Applied ${migrations.length} migration(s).`);
  } finally {
    await AppDataBase.destroy();
  }
}

void main().catch(() => {
  console.error('Database migrations failed. Inspect sanitized deployment logs.');
  process.exitCode = 1;
});