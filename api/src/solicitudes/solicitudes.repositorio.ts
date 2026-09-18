import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { esUuid } from '../comun/index.js';
import {
  ErrorDeConflicto,
  Solicitud,
  type EstadoSolicitud,
  type Usuario,
} from '../dominio/index.js';
import {
  SolicitudEntidad,
  aSolicitudDeDominio,
  aSolicitudDeEntidad,
  aUsuarioDeDominio,
} from '../persistencia/index.js';

/**
 * Índice único parcial que sostiene "una sola solicitud activa por estudiante"
 * a nivel de base (ver la migración `UnicidadDeSolicitudActiva`).
 */
const INDICE_DE_SOLICITUD_ACTIVA = 'idx_solicitudes_activa_por_usuario';

/** Violación de unicidad en PostgreSQL. */
const CODIGO_DE_UNICIDAD = '23505';

/**
 * El driver devuelve un error con `code` y `constraint`, pero llega tipado como
 * `unknown`: se lo estrecha acá en vez de castearlo.
 */
function esViolacionDelIndice(error: unknown, indice: string): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const posible = error as { code?: unknown; constraint?: unknown };
  return posible.code === CODIGO_DE_UNICIDAD && posible.constraint === indice;
}

/** Una solicitud con su estudiante ya resuelto, para no consultar de a una. */
export interface SolicitudConEstudiante {
  solicitud: Solicitud;
  estudiante: Usuario;
}

export interface FiltroDeListado {
  estado?: EstadoSolicitud;
  page: number;
  limit: number;
}

export interface PaginaDeSolicitudes {
  filas: SolicitudConEstudiante[];
  total: number;
}

/**
 * Habla con la base y devuelve objetos de **dominio**. Las entidades de TypeORM
 * no salen de esta capa.
 */
@Injectable()
export class SolicitudesRepositorio {
  constructor(
    @InjectRepository(SolicitudEntidad)
    private readonly filas: Repository<SolicitudEntidad>,
  ) {}

  async guardar(solicitud: Solicitud): Promise<Solicitud> {
    let fila: SolicitudEntidad;

    try {
      fila = await this.filas.save(this.filas.create(aSolicitudDeEntidad(solicitud)));
    } catch (error) {
      /*
       * La verificación previa del servicio cubre el caso normal, pero entre
       * consultar y escribir hay una ventana: dos peticiones simultáneas del
       * mismo estudiante —un doble clic alcanza— podrían pasar las dos. El
       * índice único parcial las frena en la base, y acá se traduce ese fallo
       * al mismo 409 que habría devuelto la verificación, para que el cliente
       * vea una sola respuesta posible y no un 500.
       */
      if (esViolacionDelIndice(error, INDICE_DE_SOLICITUD_ACTIVA)) {
        throw new ErrorDeConflicto(
          'Ya tenés una solicitud en curso. Esperá a que se resuelva para pedir otra.',
          'SOLICITUD_ACTIVA_EXISTENTE',
        );
      }
      throw error;
    }

    // En un UPDATE, TypeORM devuelve solo lo que escribió: la fecha de creación
    // no vuelve y la respuesta saldría con `creadoEn: null`. La conserva el
    // objeto de dominio, que sí la tenía.
    if (!fila.creadoEn && solicitud.creadoEn) fila.creadoEn = solicitud.creadoEn;

    return aSolicitudDeDominio(fila);
  }

  async buscarPorId(id: string): Promise<SolicitudConEstudiante | null> {
    if (!esUuid(id)) return null;

    const fila = await this.filas.findOne({
      where: { id },
      relations: { usuario: true },
    });

    return fila ? this.aFila(fila) : null;
  }

  /**
   * El historial completo del estudiante, de la más nueva a la más vieja.
   *
   * Va sin paginar a propósito: un estudiante acumula unas pocas solicitudes
   * en toda su vida con el producto, así que paginar en el servidor agregaría
   * una consulta de conteo y un ida y vuelta por página para ordenar, en el
   * mejor de los casos, seis filas. La lista se pagina en el navegador.
   */
  async listarDeUsuario(usuarioId: string): Promise<Solicitud[]> {
    const filas = await this.filas.find({
      where: { usuarioId },
      order: { creadoEn: 'DESC', id: 'DESC' },
    });

    return filas.map((fila) => aSolicitudDeDominio(fila));
  }

  /**
   * La que ocupa el cupo del estudiante. Se consulta por estado y no por la
   * última fila: si alguna vez quedaran dos activas por un dato cargado a mano,
   * la regla tiene que seguir frenando la tercera.
   */
  async buscarActivaDeUsuario(usuarioId: string): Promise<Solicitud | null> {
    const fila = await this.filas
      .createQueryBuilder('solicitud')
      .where('solicitud.usuarioId = :usuarioId', { usuarioId })
      .andWhere('solicitud.estado IN (:...estados)', {
        estados: ['pendiente', 'aprobada'],
      })
      .orderBy('solicitud.creadoEn', 'DESC')
      .getOne();

    return fila ? aSolicitudDeDominio(fila) : null;
  }

  /**
   * Listado del administrador. El estudiante viaja en el mismo `JOIN`: con una
   * consulta por fila para traer el nombre, veinte solicitudes serían veintiún
   * viajes a la base.
   */
  async listar(filtro: FiltroDeListado): Promise<PaginaDeSolicitudes> {
    const consulta = this.filas
      .createQueryBuilder('solicitud')
      .innerJoinAndSelect('solicitud.usuario', 'usuario')
      .orderBy('solicitud.creadoEn', 'DESC')
      // Desempate estable: sin esto, dos solicitudes del mismo instante pueden
      // cambiar de página entre consultas.
      .addOrderBy('solicitud.id', 'DESC')
      .skip((filtro.page - 1) * filtro.limit)
      .take(filtro.limit);

    if (filtro.estado) {
      consulta.andWhere('solicitud.estado = :estado', { estado: filtro.estado });
    }

    const [filas, total] = await consulta.getManyAndCount();

    return { filas: filas.map((fila) => this.aFila(fila)), total };
  }

  private aFila(fila: SolicitudEntidad): SolicitudConEstudiante {
    if (!fila.usuario) {
      throw new Error(
        `La solicitud ${fila.id} se leyó sin su estudiante: falta el JOIN`,
      );
    }

    return {
      solicitud: aSolicitudDeDominio(fila),
      estudiante: aUsuarioDeDominio(fila.usuario),
    };
  }
}
