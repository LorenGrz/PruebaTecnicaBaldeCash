import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { AuthController } from './auth.controller.js';
import { GuardDeIdentidad } from './guard-de-identidad.js';

@Module({
  imports: [UsuariosModule],
  controllers: [AuthController],
  // El guard es global: se protege por defecto y se abre a propósito con
  // @Publico(), que es el orden correcto para no olvidarse una ruta.
  providers: [{ provide: APP_GUARD, useClass: GuardDeIdentidad }],
})
export class AuthModule {}
