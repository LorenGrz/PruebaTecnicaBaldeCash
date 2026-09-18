import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Todas las rutas cuelgan de /api para no chocar con el frontend.
  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  });

  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
