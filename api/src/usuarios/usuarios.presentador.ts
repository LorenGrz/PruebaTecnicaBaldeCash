import type { RolUsuario, Usuario } from '../dominio/index.js';

export interface RespuestaDeUsuario {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  direccion: string | null;
  rol: RolUsuario;
  creadoEn: string | null;
}

/**
 * El objeto de dominio no se serializa directo: tiene estado privado y podría
 * ganar campos que no queremos publicar. El presentador fija el contrato de
 * salida en un solo lugar.
 */
export function aRespuestaDeUsuario(usuario: Usuario): RespuestaDeUsuario {
  if (!usuario.id) {
    throw new Error('Solo se presentan usuarios ya persistidos');
  }

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    dni: usuario.dni,
    email: usuario.email,
    telefono: usuario.telefono,
    direccion: usuario.direccion,
    rol: usuario.rol,
    creadoEn: usuario.creadoEn?.toISOString() ?? null,
  };
}
