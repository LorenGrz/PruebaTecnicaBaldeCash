import { Usuario } from '../../dominio/index.js';
import { UsuarioEntidad } from '../entidades/index.js';

/** Fila de `usuarios` -> objeto de dominio. */
export function aUsuarioDeDominio(entidad: UsuarioEntidad): Usuario {
  return Usuario.desdePersistencia({
    id: entidad.id,
    nombre: entidad.nombre,
    dni: entidad.dni,
    email: entidad.email,
    telefono: entidad.telefono,
    rol: entidad.rol,
    creadoEn: entidad.creadoEn,
  });
}

/** Objeto de dominio -> fila de `usuarios` lista para guardar. */
export function aUsuarioDeEntidad(usuario: Usuario): Partial<UsuarioEntidad> {
  return {
    ...(usuario.id ? { id: usuario.id } : {}),
    nombre: usuario.nombre,
    dni: usuario.dni,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol,
  };
}
