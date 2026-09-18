import { Injectable } from '@nestjs/common';
import { ErrorDeConflicto, Usuario } from '../dominio/index.js';
import type { CrearUsuarioDto } from './dto/index.js';
import { UsuariosRepositorio } from './usuarios.repositorio.js';

/**
 * Orquesta: pide al dominio que valide y construya, al repositorio que guarde,
 * y decide qué hacer cuando chocan. Ninguna regla de negocio vive acá.
 */
@Injectable()
export class UsuariosService {
  constructor(private readonly repositorio: UsuariosRepositorio) {}

  /**
   * Alta desde la pantalla de ingreso. El rol se fija acá y no llega del
   * cuerpo: un endpoint público no puede ser la vía para crear un
   * administrador.
   */
  async registrar(datos: CrearUsuarioDto): Promise<Usuario> {
    const usuario = Usuario.crear({
      nombre: datos.nombre,
      dni: datos.dni,
      email: datos.email,
      telefono: datos.telefono,
      rol: 'estudiante',
    });

    await this.verificarQueNoExista(usuario.dni, usuario.email);

    return this.repositorio.guardar(usuario);
  }

  async buscarPorDni(dni: string): Promise<Usuario | null> {
    return this.repositorio.buscarPorDni(dni);
  }

  /**
   * Los datos personales del formulario de solicitud pisan a los guardados: el
   * estudiante puede haber cambiado de teléfono desde el alta. El DNI no se
   * toca, identifica a la persona.
   */
  async actualizarContacto(
    usuario: Usuario,
    datos: { nombre: string; email: string; telefono: string },
  ): Promise<Usuario> {
    const sinCambios =
      usuario.nombre === datos.nombre.trim() &&
      usuario.email === datos.email.trim().toLowerCase() &&
      usuario.telefono === datos.telefono.trim();

    if (sinCambios) return usuario;

    usuario.actualizarDatosDeContacto(datos);

    const otro = await this.repositorio.buscarPorEmail(usuario.email);
    if (otro && otro.id !== usuario.id) {
      throw new ErrorDeConflicto(
        'Ya existe un usuario registrado con ese correo',
        'EMAIL_DUPLICADO',
      );
    }

    return this.repositorio.guardar(usuario);
  }

  private async verificarQueNoExista(dni: string, email: string): Promise<void> {
    if (await this.repositorio.buscarPorDni(dni)) {
      throw new ErrorDeConflicto(
        'Ya existe un usuario registrado con ese DNI',
        'DNI_DUPLICADO',
      );
    }

    if (await this.repositorio.buscarPorEmail(email)) {
      throw new ErrorDeConflicto(
        'Ya existe un usuario registrado con ese correo',
        'EMAIL_DUPLICADO',
      );
    }
  }
}
