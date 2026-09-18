import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { configuracion } from './config/index.js';
import { PersistenciaModule } from './persistencia/persistencia.module.js';
import { SolicitudesModule } from './solicitudes/solicitudes.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuracion],
      envFilePath: '.env',
    }),
    PersistenciaModule,
    UsuariosModule,
    AuthModule,
    SolicitudesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
