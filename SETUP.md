# Setup do Projeto - CREAJR Backend

## 📦 Instalação de Dependências

```bash
npm install --save-dev \
  @sentry/node \
  @sentry/profiling-node \
  eslint \
  @typescript-eslint/parser \
  @typescript-eslint/eslint-plugin \
  eslint-config-prettier \
  prettier \
  jest \
  ts-jest \
  @types/jest \
  husky \
  lint-staged
```

## 🔧 Configurar Husky

```bash
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

## 🌐 Variáveis de Ambiente

Adicione ao `.env`:
```
SENTRY_DSN=your_sentry_dsn_here
```

## 📝 Scripts do Package.json

Adicione ao `package.json`:
```json
{
  "scripts": {
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.{ts,json,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🎯 Importar Sentry

No `src/main.ts`, adicione no topo:
```typescript
import { initSentry } from './config/sentry.config';

initSentry();
```

## 📚 Swagger já está configurado

O Swagger já está instalado via `@nestjs/swagger`. Configure no main.ts:
```typescript
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('CREAJR API')
  .setDescription('API Documentation')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```
