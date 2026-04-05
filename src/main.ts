import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { json, urlencoded, type Request, type Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const docsEnabled = readBoolean(
    configService.get<string>('API_DOCS_ENABLED'),
    !isProduction,
  );
  const apiPrefix = 'api';
  const docsPath = `/${apiPrefix}/docs`;
  const openApiJsonPath = `/${apiPrefix}/openapi-json`;
  const trustProxy = readBoolean(
    configService.get<string>('TRUST_PROXY'),
    isProduction,
  );
  const bodySizeLimit =
    configService.get<string>('HTTP_BODY_LIMIT')?.trim() || '1mb';
  const expressApp = app.getHttpAdapter().getInstance() as {
    disable(name: string): void;
    set(name: string, value: boolean): void;
  };

  expressApp.disable('x-powered-by');
  expressApp.set('trust proxy', trustProxy);

  app.use(json({ limit: bodySizeLimit }));
  app.use(urlencoded({ extended: true, limit: bodySizeLimit }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.enableCors({
    origin: resolveCorsOrigins(
      configService.get<string>('CORS_ORIGINS'),
      isProduction,
    ),
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86_400,
  });
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const openApiConfig = new DocumentBuilder()
    .setTitle('SPD Ecommerce API')
    .setDescription(
      'API da loja virtual SPD Ecommerce com autenticacao, catalogo, carrinho, pedidos e integracoes operacionais.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT retornado no login.',
      },
      'bearer',
    )
    .build();

  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  if (docsEnabled) {
    app.use(docsPath, apiReference({ content: openApiDocument }));
    app.use(openApiJsonPath, (_req: Request, res: Response) => {
      res.json(openApiDocument);
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}

function readBoolean(value: string | undefined, fallback: boolean) {
  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function resolveCorsOrigins(
  value: string | undefined,
  isProduction: boolean,
): string[] | boolean {
  if (value?.trim()) {
    return value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
  }

  if (isProduction) {
    return false;
  }

  return [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
}

void bootstrap();
