import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { ConfiguracionDeBase } from '../config/index.js';
import { SolicitudEntidad, UsuarioEntidad } from './entidades/index.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const base = config.getOrThrow<ConfiguracionDeBase>('base');
        return {
          type: 'postgres' as const,
          host: base.host,
          port: base.puerto,
          username: base.usuario,
          password: base.password,
          database: base.nombre,
          entities: [UsuarioEntidad, SolicitudEntidad],
          // El esquema lo crean las migraciones, nunca la sincronización
          // automática: lo que corre en local es lo mismo que correría en
          // producción.
          synchronize: false,
        };
      },
    }),
  ],
})
export class PersistenciaModule {}
