import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuarioEntidad } from '../persistencia/index.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosRepositorio } from './usuarios.repositorio.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UsuarioEntidad])],
  controllers: [UsuariosController],
  providers: [UsuariosRepositorio, UsuariosService],
  // El guard de identidad y el módulo de solicitudes también resuelven usuarios.
  exports: [UsuariosRepositorio, UsuariosService],
})
export class UsuariosModule {}
