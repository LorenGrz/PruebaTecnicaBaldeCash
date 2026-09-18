import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { ErrorNoAutenticado } from '../comun/index.js';
import type { Usuario } from '../dominio/index.js';
import type { PeticionConUsuario } from './peticion.js';

/**
 * Inyecta el usuario que el guard dejó en la petición. Evita que cada
 * controlador tenga que leer el request a mano y lo entrega ya tipado.
 */
export const UsuarioActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): Usuario => {
    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();

    if (!peticion.usuarioActual) {
      throw new ErrorNoAutenticado(
        'La ruta necesita un usuario autenticado',
        'SIN_IDENTIDAD',
      );
    }

    return peticion.usuarioActual;
  },
);
