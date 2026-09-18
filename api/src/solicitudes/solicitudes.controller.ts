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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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
   * Va declarada **antes** que `:id`: Nest resuelve las rutas en orden y, al
   * revés, "mia" entraría como si fuera un identificador.
   *
   * Usa `@Res()` porque el estado depende del resultado — 200 con la solicitud
   * o 204 sin cuerpo — y `@HttpCode()` es fijo por handler.
   */
  @Get('mia')
  async mia(
    @UsuarioActual() estudiante: Usuario,
    @Res() respuesta: Response,
  ): Promise<void> {
    const fila = await this.servicio.buscarLaMia(estudiante);

    if (!fila) {
      respuesta.status(HttpStatus.NO_CONTENT).send();
      return;
    }

    respuesta.status(HttpStatus.OK).json({
      solicitud: aRespuestaDeSolicitud(fila.solicitud, fila.estudiante),
    });
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
