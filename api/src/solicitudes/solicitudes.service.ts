import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorNoEncontrado } from '../comun/index.js';
import {
  ErrorDeConflicto,
  ErrorDePermiso,
  ErrorDeValidacion,
  Solicitud,
  type Usuario,
} from '../dominio/index.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import type { CambiarEstadoDto, CrearSolicitudDto, ListarSolicitudesDto } from './dto/index.js';
import {
  SolicitudesRepositorio,
  type SolicitudConEstudiante,
} from './solicitudes.repositorio.js';

export const LIMITE_POR_DEFECTO = 10;
export const LIMITE_MAXIMO = 100;

export interface ListadoDeSolicitudes {
  filas: SolicitudConEstudiante[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Orquesta el caso de uso: pide datos al repositorio, deja que el dominio
 * decida y guarda el resultado. Las reglas — cuánto se puede pedir, quién
 * puede ver qué, desde qué estado se sale — viven en `Solicitud` y `Usuario`.
 */
@Injectable()
export class SolicitudesService {
  constructor(
    private readonly repositorio: SolicitudesRepositorio,
    private readonly usuarios: UsuariosService,
    private readonly config: ConfigService,
  ) {}

  /**
   * El orden importa: primero se valida el pedido (barato y sin efectos),
   * después se consulta el cupo y recién al final se escribe. Así un monto
   * inválido responde 422 aunque el estudiante ya tenga una solicitud activa,
   * y una solicitud rechazada no deja los datos de contacto actualizados a
   * medias.
   */
  async crear(
    estudiante: Usuario,
    datos: CrearSolicitudDto,
  ): Promise<SolicitudConEstudiante> {
    this.verificarDni(estudiante, datos.dni);

    const solicitud = Solicitud.crear({
      usuario: estudiante,
      monto: datos.monto,
      plazoMeses: datos.plazoMeses,
      tasaAnual: this.config.getOrThrow<number>('tasaAnual'),
    });

    await this.verificarQueNoTengaOtraActiva(this.idDe(estudiante));

    // Los datos del formulario pisan a los guardados: pudo cambiar el teléfono.
    const actualizado = await this.usuarios.actualizarContacto(estudiante, {
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
    });

    return {
      solicitud: await this.repositorio.guardar(solicitud),
      estudiante: actualizado,
    };
  }

  async listar(
    administrador: Usuario,
    filtro: ListarSolicitudesDto,
  ): Promise<ListadoDeSolicitudes> {
    if (!administrador.puedeGestionarSolicitudes()) {
      throw new ErrorDePermiso(
        'Solo un administrador puede listar las solicitudes',
      );
    }

    const page = filtro.page ?? 1;
    // El tope es del servidor: un `limit=100000` no puede volverse un escaneo
    // de toda la tabla porque el cliente lo pidió.
    const limit = Math.min(filtro.limit ?? LIMITE_POR_DEFECTO, LIMITE_MAXIMO);

    const { filas, total } = await this.repositorio.listar({
      estado: filtro.estado,
      page,
      limit,
    });

    return { filas, total, page, limit };
  }

  /**
   * El historial de un estudiante. Quien pregunta tiene que poder verlo: la
   * regla la decide `Usuario`, no este servicio, así que es la misma que
   * protege el detalle de una solicitud.
   */
  async listarDeUsuario(
    usuarioId: string,
    quienPregunta: Usuario,
  ): Promise<SolicitudConEstudiante[]> {
    if (!quienPregunta.puedeVerSolicitudesDe(usuarioId)) {
      throw new ErrorDePermiso('Estas solicitudes pertenecen a otro estudiante');
    }

    const estudiante =
      quienPregunta.id === usuarioId
        ? quienPregunta
        : await this.usuarios.buscarPorId(usuarioId);

    if (!estudiante) {
      throw new ErrorNoEncontrado('No existe ese estudiante', 'USUARIO_NO_ENCONTRADO');
    }

    const solicitudes = await this.repositorio.listarDeUsuario(usuarioId);

    return solicitudes.map((solicitud) => ({ solicitud, estudiante }));
  }

  async buscarPorId(
    id: string,
    quienPregunta: Usuario,
  ): Promise<SolicitudConEstudiante> {
    const fila = await this.repositorio.buscarPorId(id);

    if (!fila) {
      throw new ErrorNoEncontrado(
        'No existe una solicitud con ese id',
        'SOLICITUD_NO_ENCONTRADA',
      );
    }

    if (!fila.solicitud.esVisiblePara(quienPregunta)) {
      throw new ErrorDePermiso('Esta solicitud pertenece a otro estudiante');
    }

    return fila;
  }

  async cambiarEstado(
    id: string,
    datos: CambiarEstadoDto,
    administrador: Usuario,
  ): Promise<SolicitudConEstudiante> {
    if (!administrador.puedeGestionarSolicitudes()) {
      throw new ErrorDePermiso(
        'Solo un administrador puede cambiar el estado de una solicitud',
      );
    }

    const fila = await this.repositorio.buscarPorId(id);

    if (!fila) {
      throw new ErrorNoEncontrado(
        'No existe una solicitud con ese id',
        'SOLICITUD_NO_ENCONTRADA',
      );
    }

    // El estado no se escribe, se transiciona: el dominio verifica de nuevo el
    // permiso y desde qué estado se puede salir.
    switch (datos.estado) {
      case 'aprobada':
        fila.solicitud.aprobar(administrador);
        break;
      case 'rechazada':
        fila.solicitud.rechazar(administrador);
        break;
      default:
        throw new ErrorDeValidacion('El estado indicado no es válido', [
          {
            campo: 'estado',
            mensaje: 'El estado debe ser aprobada o rechazada',
          },
        ]);
    }

    return {
      solicitud: await this.repositorio.guardar(fila.solicitud),
      estudiante: fila.estudiante,
    };
  }

  /**
   * Un estudiante a la vez con una sola solicitud viva. Si la última fue
   * rechazada puede volver a pedir: `estaActiva()` lo decide, no este servicio.
   */
  private async verificarQueNoTengaOtraActiva(usuarioId: string): Promise<void> {
    const activa = await this.repositorio.buscarActivaDeUsuario(usuarioId);

    if (activa?.estaActiva()) {
      throw new ErrorDeConflicto(
        `Ya tenés una solicitud ${activa.estado}. Esperá a que se resuelva para pedir otra.`,
        'SOLICITUD_ACTIVA_EXISTENTE',
      );
    }
  }

  /**
   * El DNI identifica a la persona y no se puede cambiar desde el formulario:
   * si llega uno distinto al de la sesión, es un dato mal cargado.
   */
  private verificarDni(estudiante: Usuario, dni: string): void {
    if (estudiante.dni !== dni.trim()) {
      throw new ErrorDeValidacion('Los datos de la solicitud son inválidos', [
        {
          campo: 'dni',
          mensaje: 'El DNI no coincide con el del usuario que inició sesión',
        },
      ]);
    }
  }

  private idDe(usuario: Usuario): string {
    if (!usuario.id) {
      throw new Error('El usuario autenticado siempre tiene id');
    }
    return usuario.id;
  }
}
