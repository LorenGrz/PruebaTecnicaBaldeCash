import { randomUUID } from 'node:crypto';
import {
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ArgumentsHost,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  ErrorDeConflicto,
  ErrorDePermiso,
  ErrorDeValidacion,
} from '../dominio/index.js';

export interface CuerpoDeError {
  statusCode: number;
  error: string;
  mensaje: string;
  [clave: string]: unknown;
}

const NOMBRES_DE_ERROR: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'SolicitudInvalida',
  [HttpStatus.UNAUTHORIZED]: 'NoAutenticado',
  [HttpStatus.FORBIDDEN]: 'SinPermiso',
  [HttpStatus.NOT_FOUND]: 'NoEncontrado',
  [HttpStatus.CONFLICT]: 'Conflicto',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'ValidacionFallida',
};

function nombreDeError(estado: number): string {
  return NOMBRES_DE_ERROR[estado] ?? 'ErrorHttp';
}

/**
 * Único traductor de errores a HTTP. Los errores del dominio no conocen
 * códigos de estado: los lanzan por lo que significan y acá se decide con qué
 * número salen.
 *
 * Lo que no está previsto sale como 500 genérico con un `requestId`: el detalle
 * real queda en el log del servidor y el cliente recibe algo con lo que pedir
 * soporte, nunca un stack trace ni el nombre de una tabla.
 */
@Catch()
export class FiltroDeExcepciones implements ExceptionFilter {
  private readonly logger = new Logger(FiltroDeExcepciones.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const contexto = host.switchToHttp();
    const respuesta = contexto.getResponse<Response>();
    const peticion = contexto.getRequest<Request>();

    const cuerpo = this.traducir(excepcion, peticion);
    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private traducir(excepcion: unknown, peticion: Request): CuerpoDeError {
    if (excepcion instanceof ErrorDeValidacion) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'ValidacionFallida',
        mensaje: excepcion.message,
        detalles: excepcion.detalles,
      };
    }

    if (excepcion instanceof ErrorDeConflicto) {
      return {
        statusCode: HttpStatus.CONFLICT,
        error: 'Conflicto',
        mensaje: excepcion.message,
        codigo: excepcion.codigo,
      };
    }

    if (excepcion instanceof ErrorDePermiso) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        error: 'SinPermiso',
        mensaje: excepcion.message,
        codigo: excepcion.codigo,
      };
    }

    if (excepcion instanceof HttpException) {
      return this.desdeHttpException(excepcion);
    }

    return this.desdeErrorInesperado(excepcion, peticion);
  }

  /** Respeta el estado que eligió Nest y conserva los campos extra (`codigo`). */
  private desdeHttpException(excepcion: HttpException): CuerpoDeError {
    const estado = excepcion.getStatus();
    const contenido: unknown = excepcion.getResponse();

    if (typeof contenido !== 'object' || contenido === null) {
      return {
        statusCode: estado,
        error: nombreDeError(estado),
        mensaje: typeof contenido === 'string' ? contenido : excepcion.message,
      };
    }

    const original = contenido as Record<string, unknown>;
    const extras: Record<string, unknown> = {};
    for (const [clave, valor] of Object.entries(original)) {
      if (!['statusCode', 'error', 'mensaje', 'message'].includes(clave)) {
        extras[clave] = valor;
      }
    }

    return {
      statusCode: estado,
      error:
        typeof original.error === 'string'
          ? original.error
          : nombreDeError(estado),
      mensaje: this.leerMensaje(original) ?? excepcion.message,
      ...extras,
    };
  }

  private leerMensaje(original: Record<string, unknown>): string | null {
    if (typeof original.mensaje === 'string') return original.mensaje;
    if (typeof original.message === 'string') return original.message;
    if (Array.isArray(original.message)) return original.message.join('. ');
    return null;
  }

  private desdeErrorInesperado(
    excepcion: unknown,
    peticion: Request,
  ): CuerpoDeError {
    const requestId = randomUUID();
    const detalle =
      excepcion instanceof Error ? excepcion.stack : String(excepcion);

    this.logger.error(
      `[${requestId}] ${peticion.method} ${peticion.originalUrl} falló: ${detalle}`,
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'ErrorInterno',
      mensaje:
        'Ocurrió un error inesperado. Informá el requestId para poder rastrearlo.',
      requestId,
    };
  }
}
