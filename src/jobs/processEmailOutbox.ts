import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppDataBase } from '../db';
import { AppModule } from '../modules/app.module';
import { EmailService } from '../services/EmailService';

async function main() {
  process.env.EMAIL_WORKER_ENABLED = 'false';
  await AppDataBase.initialize();
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    await app.get(EmailService).processBatch();
  } finally {
    await app.close();
    await AppDataBase.destroy();
  }
}

void main().catch(() => {
  console.error('Email outbox job failed. Inspect sanitized job logs.');
  process.exitCode = 1;
});