import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Todas las rutas cuelgan de /api para no chocar con el frontend.
  app.setGlobalPrefix('api');

  app.enableCors({ origin: config.getOrThrow<string>('origenWeb') });

  const puerto = config.getOrThrow<number>('puerto');
  const tasaAnual = config.getOrThrow<number>('tasaAnual');

  await app.listen(puerto);

  new Logger('Bootstrap').log(
    `API escuchando en http://localhost:${puerto}/api · tasa anual ${(tasaAnual * 100).toFixed(2)}%`,
  );
}
await bootstrap();
