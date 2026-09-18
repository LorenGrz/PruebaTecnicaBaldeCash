import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudEntidad } from '../persistencia/index.js';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { SolicitudesController } from './solicitudes.controller.js';
import { SolicitudesRepositorio } from './solicitudes.repositorio.js';
import { SolicitudesService } from './solicitudes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([SolicitudEntidad]), UsuariosModule],
  controllers: [SolicitudesController],
  providers: [SolicitudesRepositorio, SolicitudesService],
})
export class SolicitudesModule {}
