import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { configurarAplicacion } from './comun/index.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Prefijo /api, validación 422 y filtro de errores: lo mismo que usan los
  // tests e2e, para que no se prueben condiciones distintas a las reales.
  configurarAplicacion(app);

  app.enableCors({ origin: config.getOrThrow<string>('origenWeb') });

  const puerto = config.getOrThrow<number>('puerto');
  const tasaAnual = config.getOrThrow<number>('tasaAnual');

  await app.listen(puerto);

  new Logger('Bootstrap').log(
    `API escuchando en http://localhost:${puerto}/api · tasa anual ${(tasaAnual * 100).toFixed(2)}%`,
  );
}
await bootstrap();
