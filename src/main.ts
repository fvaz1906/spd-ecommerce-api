import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: false,
  });
  app.setGlobalPrefix('api');
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

  app.use('/docs', apiReference({ content: openApiDocument }));
  app.use('/openapi-json', (_req: Request, res: Response) => {
    res.json(openApiDocument);
  });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
