import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './modules/app.module';
import { AppDataBase } from './db';

async function bootstrap() {
  await AppDataBase.initialize();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000/'],
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

  await app.listen(3333);
  console.log('Servidor NestJS rodando na porta 3333');
  console.log('Documentação Swagger: http://localhost:3333/api/docs');
}

bootstrap();
