import type { Request } from 'express';
import type { Usuario } from '../dominio/index.js';

/** Cabecera donde viaja la identidad. Ver `guard-de-identidad.ts`. */
export const CABECERA_DE_IDENTIDAD = 'x-usuario-id';

/** La petición después de pasar por el guard: ya trae el usuario resuelto. */
export interface PeticionConUsuario extends Request {
  usuarioActual?: Usuario;
}
