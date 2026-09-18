import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { configuracion } from './config/index.js';
import { PersistenciaModule } from './persistencia/persistencia.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuracion],
      envFilePath: '.env',
    }),
    PersistenciaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
