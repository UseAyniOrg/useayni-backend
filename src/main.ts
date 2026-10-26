import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { CorsOptions } from 'cors';
import { AppModule } from './modules/app.module';
import { AppDataBase } from './db';
import { MutationAuditInterceptor } from './middlewares/mutationAudit.interceptor';
import { initializeR2Storage } from './lib/storage/r2';
import './jobs/cleanPendingMediaAssets';
import { isTenantOrigin } from './helpers/corsOrigin';

async function bootstrap() {
  initializeR2Storage();
  await AppDataBase.initialize();

  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableShutdownHooks();
  app.use(
    ['/media/uploads', '/org-home/admin/organizations'],
    express.raw({ type: ['image/*', 'application/pdf'], limit: '10mb' }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.useGlobalInterceptors(new MutationAuditInterceptor());

  const configuredOrigins = new Set(
    (process.env.ALLOWED_ORIGINS ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
  const corsOrigin: NonNullable<CorsOptions['origin']> = (origin, callback) => {
    callback(null, !origin || configuredOrigins.has(origin) || isTenantOrigin(origin));
  };
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('CREAJR API')
    .setDescription('API documentation for CREAJR backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env.PORT ?? 3333);
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor NestJS rodando na porta ${port}`);
}

bootstrap();
