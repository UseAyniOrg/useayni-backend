"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const core_1 = require("@nestjs/core");
const express_1 = __importDefault(require("express"));
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./modules/app.module");
const db_1 = require("./db");
const mutationAudit_interceptor_1 = require("./middlewares/mutationAudit.interceptor");
const r2_1 = require("./lib/storage/r2");
require("./jobs/cleanPendingMediaAssets");
const corsOrigin_1 = require("./helpers/corsOrigin");
async function bootstrap() {
    (0, r2_1.initializeR2Storage)();
    await db_1.AppDataBase.initialize();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    app.enableShutdownHooks();
    app.use(['/media/uploads', '/org-home/admin/organizations'], express_1.default.raw({ type: ['image/*', 'application/pdf'], limit: '10mb' }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.useGlobalInterceptors(new mutationAudit_interceptor_1.MutationAuditInterceptor());
    const configuredOrigins = new Set((process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean));
    const corsOrigin = (origin, callback) => {
        callback(null, !origin || configuredOrigins.has(origin) || (0, corsOrigin_1.isTenantOrigin)(origin));
    };
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('CREAJR API')
        .setDescription('API documentation for CREAJR backend')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = Number(process.env.PORT ?? 3333);
    await app.listen(port, '0.0.0.0');
    console.log(`Servidor NestJS rodando na porta ${port}`);
}
bootstrap();
