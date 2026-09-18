import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsuarioActual } from '../auth/usuario-actual.decorador.js';
import type { Usuario } from '../dominio/index.js';
import {
  CambiarEstadoDto,
  CrearSolicitudDto,
  ListarSolicitudesDto,
} from './dto/index.js';
import {
  aRespuestaDeSolicitud,
  type RespuestaDeSolicitud,
} from './solicitudes.presentador.js';
import { SolicitudesService } from './solicitudes.service.js';

export interface RespuestaPaginada {
  data: RespuestaDeSolicitud[];
  total: number;
  page: number;
  limit: number;
}

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly servicio: SolicitudesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async crear(
    @UsuarioActual() estudiante: Usuario,
    @Body() datos: CrearSolicitudDto,
  ): Promise<{ solicitud: RespuestaDeSolicitud }> {
    const fila = await this.servicio.crear(estudiante, datos);
    return { solicitud: aRespuestaDeSolicitud(fila.solicitud, fila.estudiante) };
  }

  /** Listado del administrador, con filtro por estado y paginación. */
  @Get()
  async listar(
    @UsuarioActual() usuario: Usuario,
    @Query() filtro: ListarSolicitudesDto,
  ): Promise<RespuestaPaginada> {
    const listado = await this.servicio.listar(usuario, filtro);

    return {
      data: listado.filas.map((fila) =>
        aRespuestaDeSolicitud(fila.solicitud, fila.estudiante),
      ),
      total: listado.total,
      page: listado.page,
      limit: listado.limit,
    };
  }

  /**
   * El historial del estudiante, de la más nueva a la más vieja.
   *
   * Va declarada **antes** que `:id`: Nest resuelve las rutas en orden y, al
   * revés, "mias" entraría como si fuera un identificador.
   *
   * Devuelve el historial completo sin paginar: un estudiante junta unas pocas
   * solicitudes en toda su vida con el producto, así que pagina el navegador.
   * Se responde `{ data, total }`, la misma forma que el listado del
   * administrador, para que el cliente no tenga que aprender dos contratos.
   */
  @Get('mias')
  async mias(
    @UsuarioActual() estudiante: Usuario,
  ): Promise<{ data: RespuestaDeSolicitud[]; total: number }> {
    const filas = await this.servicio.listarDeUsuario(
      estudiante.id ?? '',
      estudiante,
    );

    const data = filas.map((fila) =>
      aRespuestaDeSolicitud(fila.solicitud, fila.estudiante),
    );

    return { data, total: data.length };
  }

  @Get(':id')
  async detalle(
    @UsuarioActual() usuario: Usuario,
    @Param('id') id: string,
  ): Promise<{ solicitud: RespuestaDeSolicitud }> {
    const fila = await this.servicio.buscarPorId(id, usuario);
    return { solicitud: aRespuestaDeSolicitud(fila.solicitud, fila.estudiante) };
  }

  @Patch(':id/estado')
  async cambiarEstado(
    @UsuarioActual() usuario: Usuario,
    @Param('id') id: string,
    @Body() datos: CambiarEstadoDto,
  ): Promise<{ solicitud: RespuestaDeSolicitud }> {
    const fila = await this.servicio.cambiarEstado(id, datos, usuario);
    return { solicitud: aRespuestaDeSolicitud(fila.solicitud, fila.estudiante) };
  }
}
